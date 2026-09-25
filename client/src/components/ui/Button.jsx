export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  }[variant] || 'btn-primary';
  return <button className={`${baseClass} ${className}`} {...props}>{children}</button>;
}
