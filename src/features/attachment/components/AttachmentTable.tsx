import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { App, Button, Table, type TableColumnsType } from 'antd';

import { getAttachmentFile } from '../attachment.api';
import { formatFileSize } from '../attachment.file';
import type { AttachmentType } from '../attachment.type';
import { formatDateTime } from '../../../shared/format/date.format';
import { formatFullName } from '../../../shared/format/name.format';

const EMPTY_VALUE = '—';

// Hands the downloaded file to the browser's save dialog under its original name.
function saveFile(file: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(objectUrl);
}

type AttachmentTableProps = {
    attachments: AttachmentType[];
};

// An execution's attachments. Downloading fetches the file through the API client (not a plain link), so a
// failed download shows an error instead of saving the error response as the file.
export function AttachmentTable({ attachments }: AttachmentTableProps) {
    const { t } = useTranslation('attachment');
    const { message } = App.useApp();
    const [downloadingId, setDownloadingId] = useState<number>();

    const handleDownload = async (attachment: AttachmentType) => {
        setDownloadingId(attachment.id);

        try {
            saveFile(await getAttachmentFile(attachment.url), attachment.fileName);
        } catch (error) {
            console.error('Failed to download the attachment:', error);
            message.error(t('notifications.downloadError', { name: attachment.fileName }));
        } finally {
            setDownloadingId(undefined);
        }
    };

    const columns: TableColumnsType<AttachmentType> = [
        {
            title: t('table.fileColumn'),
            key: 'fileName',
            render: (_, attachment) => (
                <Button
                    type="link"
                    size="small"
                    aria-label={t('table.download', { name: attachment.fileName })}
                    loading={downloadingId === attachment.id}
                    onClick={() => void handleDownload(attachment)}
                >
                    {attachment.fileName}
                </Button>
            ),
        },
        { title: t('table.sizeColumn'), key: 'size', render: (_, attachment) => formatFileSize(attachment.sizeBytes) },
        {
            title: t('table.uploadedByColumn'),
            key: 'uploadedBy',
            render: (_, { uploadedBy }) => (uploadedBy ? formatFullName(uploadedBy.firstName, uploadedBy.lastName) : EMPTY_VALUE),
        },
        { title: t('table.uploadedAtColumn'), key: 'createdAt', render: (_, attachment) => formatDateTime(attachment.createdAt) },
    ];

    return (
        <Table<AttachmentType>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={attachments}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: t('table.empty') }}
        />
    );
}
