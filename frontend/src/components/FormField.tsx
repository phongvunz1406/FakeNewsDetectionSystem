interface FormFieldProps {
    id: string;
    label: string;
    type?: "text" | "email" | "password" | "number";
    placeholder?: string;
    required?: boolean;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}
const baseLabelClass = "block text-lg font-medium text-black"
const baseInputClass =
  "w-full border border-gray-300 px-4 py-3 text-black placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"

export function FormInput({id, label, type = "text", placeholder, required = false, value, onChange}: FormFieldProps) {
    return (
        <div className="space-y-3">
            <label htmlFor={id} className={baseLabelClass}>
                {label}{required && <span className="text-red-600 ml-1">*</span>}
            </label>
            <input id={id} type={type} required={required} placeholder={placeholder} value={value} onChange={onChange} className={baseInputClass}/>
        </div>
    );
}

export function FormTextArea({id, label, placeholder, required = false, value, onChange}: FormFieldProps) {
    return(
        <div className="space-y-3">
            <label htmlFor={id} className={baseLabelClass}>
                {label}{required && <span className="text-red-600 ml-1">*</span>}
            </label>
            <textarea id={id} required={required} placeholder={placeholder} value={value} onChange={onChange} rows={4} className={baseInputClass}/>
        </div>
    )
}