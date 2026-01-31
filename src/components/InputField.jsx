const InputField = ({ label, helper, ...props }) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-white/80">
    <span>{label}</span>
    <input className="input-primary" {...props} />
    {helper ? <span className="text-xs text-white/50">{helper}</span> : null}
  </label>
)

export default InputField
