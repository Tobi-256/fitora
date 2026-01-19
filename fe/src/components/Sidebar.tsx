import React from 'react';

const categories = [
  'Tops',
  'Bottoms',
  'Shoes',
  'Accessories',
];

export default function Sidebar() {
  return (
    <aside style={{ minWidth: 220, padding: '32px 20px 0 40px', fontWeight: 500 }}>
      <div style={{ marginBottom: 16, fontWeight: 700, fontStyle: 'italic' }}>Categories</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {categories.map((cat) => (
          <li key={cat} style={{ marginBottom: 8 }}>
            <a href="#" style={{ color: '#2a6be0', textDecoration: 'underline', cursor: 'pointer' }}>{cat}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
