export default function Input({ label, className = '', ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input className={`input-field ${className}`} {...props} />
    </div>
  );
}
