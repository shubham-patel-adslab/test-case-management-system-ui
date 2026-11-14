import { Controller, type Control, type FieldError, type FieldValues, type Path } from 'react-hook-form';
import type { TFunction } from 'i18next';
import { Form, Input } from 'antd';

const DEFAULT_ROWS = 4;

type FormTextAreaFieldProps<TFieldValues extends FieldValues> = {
    name: Path<TFieldValues>;
    label: string;
    control: Control<TFieldValues>;
    error?: FieldError;
    t: TFunction;
    required?: boolean;
    rows?: number;
};

export function FormTextAreaField<TFieldValues extends FieldValues>({
    name,
    label,
    control,
    error,
    t,
    required,
    rows = DEFAULT_ROWS,
}: FormTextAreaFieldProps<TFieldValues>) {
    return (
        <Form.Item
            label={label}
            htmlFor={name}
            required={required}
            validateStatus={error ? 'error' : ''}
            help={error?.message && t(error.message)}
        >
            <Controller
                name={name}
                control={control}
                render={({ field }) => <Input.TextArea id={name} rows={rows} {...field} />}
            />
        </Form.Item>
    );
}
