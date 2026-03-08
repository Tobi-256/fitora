import React from 'react';

const items = [
    { src: '/items/item1.jpg', alt: 'Shirt', id: 1 },
    { src: '/items/item2.jpg', alt: 'Pants', id: 2 },
    { src: '/items/item3.jpg', alt: 'Jeans', id: 3 },
    { src: '/items/item4.jpg', alt: 'Jacket', id: 4 },
    { src: '/items/item5.jpg', alt: 'Shoes', id: 5 },
    { src: '/items/item6.jpg', alt: 'Bag', id: 6 },
    { src: '/items/item7.jpg', alt: 'Shorts', id: 7 },
];

interface Item {
    src: string;
    alt: string;
    id: number;
}

interface ItemListProps {
    onSelect?: (item: Item) => void;
}

export default function ItemList({ onSelect }: ItemListProps) {
    return (
        <div style={{ marginTop: 0, paddingTop: 10 }}>
            <div style={{ marginBottom: 8, textAlign: 'center', color: '#888' }}>Available Items (Click to Try)</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onSelect && onSelect(item)}
                        style={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <img
                            src={item.src}
                            alt={item.alt}
                            style={{
                                width: 64,
                                height: 64,
                                objectFit: 'cover',
                                borderRadius: 8,
                                border: '1px solid #ddd',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
