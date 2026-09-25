import Input from './Input';

export default function DatePicker({ label, value, onChange, ...props }) {
  return <Input label={label} type="date" value={value} onChange={(e) => onChange(e.target.value)} {...props} />;
}
