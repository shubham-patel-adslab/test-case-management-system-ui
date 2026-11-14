import { Controller, type Control, type FieldError, type FieldValues, type Path } from 'react-hook-form';
import type { TFunction } from 'i18next';
import { Form, Select } from 'antd';

export type FormSelectOption = {
    value: string;
    label: string;
};

type FormSelectFieldProps<TFieldValues extends FieldValues> = {
    name: Path<TFieldValues>;
    label: string;
    control: Control<TFieldValues>;
    options: FormSelectOption[];
    error?: FieldError;
    t: TFunction;
    required?: boolean;
};

export function FormSelectField<TFieldValues extends FieldValues>({
    name,
    label,
    control,
    options,
    error,
    t,
    required,
}: FormSelectFieldProps<TFieldValues>) {
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
                render={({ field }) => <Select id={name} options={options} {...field} />}
            />
        </Form.Item>
    );
}
