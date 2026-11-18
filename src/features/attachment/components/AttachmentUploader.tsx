import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { App, Button, Flex, Progress, Table, Tooltip, Typography, Upload, type GetProp, type TableColumnsType, type UploadProps } from 'antd';

import { uploadAttachments } from '../attachment.api';
import { ATTACHMENT_EXTENSIONS, ATTACHMENT_FIELD_NAME, ATTACHMENT_MAX_BYTES, ATTACHMENT_MAX_FILES } from '../attachment.constant';
import { checkAttachmentFile, formatFileSize, type AttachmentFileProblem } from '../attachment.file';
import { API_ERROR_CODE, getApiErrorCode, getApiErrorDetails } from '../../../app/api-error';

const HTTP_STATUS_PAYLOAD_TOO_LARGE = 413;

// The picked file as antd hands it over: a File with a uid.
type PickedFile = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
// "files[2]" — the API's error for one file, by its position in the upload.
const FILE_ERROR_FIELD = new RegExp(`^${ATTACHMENT_FIELD_NAME}\\[(\\d+)\\]$`);

// A picked file, waiting to be uploaded. `rejectedByServer`: the API refused its content on the last attempt.
type SelectedFile = {
    uid: string;
    file: PickedFile;
    rejectedByServer?: boolean;
};

type SelectedFileProblem = AttachmentFileProblem | 'content';

function getProblem(selected: SelectedFile): SelectedFileProblem | undefined {
    return checkAttachmentFile(selected.file) ?? (selected.rejectedByServer ? 'content' : undefined);
}

// By status, not code: a proxy in front of the API may refuse a large body before the API sees it.
function isPayloadTooLarge(error: unknown): boolean {
    return isAxiosError(error) && error.response?.status === HTTP_STATUS_PAYLOAD_TOO_LARGE;
}

// Positions of the files the API rejected (400 on files[i]).
function getRejectedIndexes(error: unknown): Set<number> {
    return new Set(getApiErrorDetails(error)
        .map((detail) => FILE_ERROR_FIELD.exec(detail.field)?.[1])
        .filter((index) => index !== undefined)
        .map(Number));
}

type AttachmentUploaderProps = {
    projectId: number;
    // Must be recorded: the API refuses attachments while it's pending.
    executionId: number;
    // Set when nothing can be added — a role that may only look (ui-requirements §2 rule 3), or a run not yet
    // recorded: the control is shown disabled, the reason as its tooltip and in place of the file-type hint.
    disabledReason?: string;
    // The run's attachments and audit trail changed.
    onUploaded: () => Promise<unknown>;
};

// Pick 1–5 files, see what's wrong with any of them before sending, then upload them all at once with
// progress. All-or-nothing, like the API: one rejected file and nothing is saved.
export function AttachmentUploader({ projectId, executionId, disabledReason, onUploaded }: AttachmentUploaderProps) {
    const { t } = useTranslation('attachment');
    const { message } = App.useApp();
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    const [progress, setProgress] = useState(0);

    const uploadMutation = useMutation({
        mutationFn: (files: SelectedFile[]) => uploadAttachments(projectId, executionId, files.map(({ file }) => file), setProgress),
        onMutate: () => setProgress(0),
        onSuccess: async (attachments) => {
            await onUploaded();
            setSelectedFiles([]);
            message.success(t('notifications.uploaded', { count: attachments.length }));
        },
        onError: (error, files) => {
            const rejected = getRejectedIndexes(error);

            if (getApiErrorCode(error) === API_ERROR_CODE.VALIDATION_ERROR && rejected.size > 0) {
                setSelectedFiles(files.map((selected, index) => ({ ...selected, rejectedByServer: rejected.has(index) })));
                message.error(t('notifications.rejected'));
                return;
            }

            if (isPayloadTooLarge(error)) {
                message.error(t('notifications.tooLarge'));
                return;
            }

            console.error('Failed to upload the attachments:', error);
            message.error(t('notifications.error'));
        },
    });

    const isUploading = uploadMutation.isPending;
    const extraCount = selectedFiles.length - ATTACHMENT_MAX_FILES;
    const hasProblem = selectedFiles.some((selected) => getProblem(selected) !== undefined);
    const canUpload = selectedFiles.length > 0 && extraCount <= 0 && !hasProblem && !isUploading;

    // Called once per picked file. LIST_IGNORE: antd neither uploads it nor keeps its own list; this one is shown.
    const handlePick = (file: PickedFile) => {
        setSelectedFiles((current) => [...current, { uid: file.uid, file }]);

        return Upload.LIST_IGNORE;
    };

    const handleRemove = (uid: string) => setSelectedFiles((current) => current.filter((selected) => selected.uid !== uid));

    const columns: TableColumnsType<SelectedFile> = [
        { title: t('table.fileColumn'), key: 'name', render: (_, { file }) => file.name },
        { title: t('table.sizeColumn'), key: 'size', render: (_, { file }) => formatFileSize(file.size) },
        {
            key: 'problem',
            render: (_, selected) => {
                const problem = getProblem(selected);

                return problem && <Typography.Text type="danger">{t(`problem.${problem}`)}</Typography.Text>;
            },
        },
        {
            key: 'remove',
            width: 48,
            render: (_, { uid, file }) => (
                <Tooltip title={t('upload.remove', { name: file.name })}>
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={t('upload.remove', { name: file.name })}
                        disabled={isUploading}
                        onClick={() => handleRemove(uid)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap="small">
            <Flex gap="small" align="center" wrap>
                <Tooltip title={disabledReason}>
                    <span>
                        <Upload
                            multiple
                            accept={ATTACHMENT_EXTENSIONS.join(',')}
                            beforeUpload={handlePick}
                            showUploadList={false}
                            disabled={!!disabledReason || isUploading}
                        >
                            <Button icon={<PaperClipOutlined />} disabled={!!disabledReason || isUploading}>{t('upload.choose')}</Button>
                        </Upload>
                    </span>
                </Tooltip>
                <Typography.Text type="secondary">
                    {disabledReason ?? t('upload.hint', { maxFiles: ATTACHMENT_MAX_FILES, maxSize: formatFileSize(ATTACHMENT_MAX_BYTES) })}
                </Typography.Text>
            </Flex>

            {selectedFiles.length > 0 && (
                <>
                    <Table<SelectedFile>
                        aria-label={t('upload.selectedLabel')}
                        rowKey="uid"
                        size="small"
                        showHeader={false}
                        columns={columns}
                        dataSource={selectedFiles}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                    />
                    {extraCount > 0 && (
                        <Typography.Text type="danger" role="alert">
                            {t('upload.tooMany', { max: ATTACHMENT_MAX_FILES, extra: extraCount })}
                        </Typography.Text>
                    )}
                    {isUploading && <Progress percent={progress} size="small" aria-label={t('upload.progressLabel')} />}
                    <Flex gap="small">
                        {/* No `loading`: the progress bar shows the upload, and antd leaves a "loading" icon behind in the
                            button's accessible name when it goes from loading straight to disabled (a rejected file). */}
                        <Button type="primary" disabled={!canUpload} onClick={() => uploadMutation.mutate(selectedFiles)}>
                            {t('upload.submit', { count: selectedFiles.length })}
                        </Button>
                        <Button disabled={isUploading} onClick={() => setSelectedFiles([])}>{t('upload.clear')}</Button>
                    </Flex>
                </>
            )}
        </Flex>
    );
}
