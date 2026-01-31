const SectionCard = ({ title, action, children }) => (
  <section className="glass rounded-3xl p-5">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
    {children}
  </section>
)

export default SectionCard
