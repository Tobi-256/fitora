import { Spin } from 'antd';

export const Loading = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh' 
    }}>
      <Spin size="large" tip="Loading..." />
    </div>
  );
};
