export default function ClassTabs({ classes, active, onChange }) {
  const all = [{ id: 'all', name: 'All Classes' }, ...classes.map((c) => ({ id: c.id, name: c.class_name }))]

  return (
    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
      {all.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`btn clay-element ${active === tab.id ? 'primary' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.name}
        </button>
      ))}
    </div>
  )
}
