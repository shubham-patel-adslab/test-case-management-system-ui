import { useTranslation } from 'react-i18next';
import { Flex, Tag, Tooltip } from 'antd';

type TestCaseTagListProps = {
    tags: string[];
    // Shows this many and a "+n" with the rest in a tooltip; all when omitted.
    max?: number;
};

export function TestCaseTagList({ tags, max }: TestCaseTagListProps) {
    const { t } = useTranslation('testCase');

    const shown = max === undefined ? tags : tags.slice(0, max);
    const hidden = tags.slice(shown.length);

    return (
        <Flex gap={4} wrap>
            {shown.map((tag) => <Tag key={tag}>{tag}</Tag>)}
            {hidden.length > 0 && (
                <Tooltip title={hidden.join(', ')}>
                    <Tag>{t('table.moreTags', { count: hidden.length })}</Tag>
                </Tooltip>
            )}
        </Flex>
    );
}
