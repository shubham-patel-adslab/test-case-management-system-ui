import { Controller, type Control, type FieldError, type FieldValues, type Path } from 'react-hook-form';
import type { TFunction } from 'i18next';
import { Form, Input } from 'antd';

type FormTextFieldProps<TFieldValues extends FieldValues> = {
    name: Path<TFieldValues>;
    label: string;
    control: Control<TFieldValues>;
    error?: FieldError;
    t: TFunction;
    required?: boolean;
    type?: string;
};

export function FormTextField<TFieldValues extends FieldValues>({
    name,
    label,
    control,
    error,
    t,
    required,
    type,
}: FormTextFieldProps<TFieldValues>) {
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
                render={({ field }) => <Input id={name} type={type} {...field} />}
            />
        </Form.Item>
    );
}
