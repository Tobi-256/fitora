import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, MapPin, CreditCard, User, 
  ChevronLeft, Printer, Clock, Truck, CheckCircle 
} from 'lucide-react';
import { orderService } from '../services/api'; // Đảm bảo import đúng service

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await orderService.getOrderDetail(id!);
        
        // FIX LỖI MẢNG: Vì API của bạn trả về một mảng [ {id: ...} ]
        if (Array.isArray(res.data) && res.data.length > 0) {
          setOrder(res.data[0]); 
        } else {
          setOrder(res.data);
        }
      } catch (err) {
        console.error("Lỗi lấy chi tiết:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  // 1. Xử lý lúc đang tải
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  // 2. Xử lý nếu không có dữ liệu (Chống trắng trang)
  if (!order) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold text-gray-600">Không tìm thấy đơn hàng!</h2>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline text-sm">Quay lại</button>
    </div>
  );

  // Hàm format ngày từ Firebase Timestamp ({_seconds: ...})
  const formatDate = (timestamp: any) => {
    if (timestamp?._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleString('vi-VN');
    }
    return 'Chưa cập nhật';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto">
        
        {/* Nút quay lại */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-blue-600 transition font-medium"
          >
            <ChevronLeft size={20} /> <span className="ml-1">Quay lại danh sách</span>
          </button>
        </div>

        {/* Header Thông tin chính */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 uppercase">
                Đơn hàng <span className="text-blue-600">#{id?.substring(0, 8)}...</span>
              </h1>
              <p className="text-gray-400 mt-1 flex items-center text-sm">
                <Clock size={14} className="mr-1" /> Ngày đặt: {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider border border-blue-100">
              {order.status || 'Đang xử lý'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Sản phẩm & Người nhận */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Danh sách sản phẩm (Dùng order.items thay vì products) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center uppercase text-sm tracking-widest">
                  <Package size={18} className="mr-2 text-blue-500" /> Sản phẩm đã đặt
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {(order.items || []).map((item: any, index: number) => (
                  <div key={index} className="p-5 flex items-center hover:bg-gray-50 transition">
                    <img 
                      src={item.image || 'https://via.placeholder.com/80'} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100" 
                    />
                    <div className="ml-4 flex-1">
                      <h4 className="font-bold text-gray-900 leading-tight text-base">{item.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">Size: <span className="font-semibold text-gray-700">{item.size}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{(item.price || 0).toLocaleString()}đ</p>
                      <p className="text-gray-400 text-xs font-medium">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thông tin giao hàng (shippingInfo) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center uppercase text-sm tracking-widest">
                <MapPin size={18} className="mr-2 text-red-500" /> Thông tin nhận hàng
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Họ và tên</p>
                  <p className="font-bold text-gray-900 text-base">{order.shippingInfo?.fullName || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Số điện thoại</p>
                  <p className="font-bold text-gray-900 text-base">{order.shippingInfo?.phone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Địa chỉ nhận hàng</p>
                  <p className="text-gray-700 leading-relaxed italic">"{order.shippingInfo?.address || 'N/A'}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Tổng thanh toán */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
              <h3 className="font-bold text-gray-800 mb-6 uppercase text-sm tracking-widest">Hóa đơn chi tiết</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Tổng tiền hàng</span>
                  <span className="text-gray-800">{(order.totalAmount || 0).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600 font-bold uppercase text-[10px]">Miễn phí</span>
                </div>
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Khuyến mãi</span>
                  <span>-0đ</span>
                </div>
                <hr className="border-gray-50" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-900 font-extrabold text-base uppercase">Tổng cộng</span>
                  <span className="text-2xl font-black text-blue-600">
                    {(order.totalAmount || 0).toLocaleString()}đ
                  </span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <p className="text-[11px] text-gray-400 flex items-start leading-relaxed">
                   <CheckCircle size={14} className="mr-2 mt-0.5 shrink-0 text-blue-500" />
                   Trạng thái thanh toán: <span className="ml-1 text-gray-700 font-bold uppercase">Chờ xử lý</span>
                 </p>
              </div>

              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-6 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-[0.98]">
                Hỗ trợ khách hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;