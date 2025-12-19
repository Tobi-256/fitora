# Hướng dẫn xóa User thủ công trên Firebase Console

## Cách 1: Xóa qua Firebase Console (Đơn giản nhất)

### Bước 1: Truy cập Firebase Console
1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn

### Bước 2: Vào Authentication
1. Click vào **Authentication** ở menu bên trái
2. Chọn tab **Users**

### Bước 3: Tìm và xóa user
1. Tìm user theo email trong danh sách
2. Click vào **3 chấm (⋮)** bên cạnh user
3. Chọn **Delete user**
4. Xác nhận xóa

### Xóa nhiều users cùng lúc
1. Chọn checkbox bên cạnh các users cần xóa
2. Click **Delete selected** ở trên cùng
3. Xác nhận xóa

## Cách 2: Xóa qua API (Tự động)

### Sử dụng endpoint cleanup
```bash
POST http://localhost:5000/api/users/cleanup-firebase
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Sử dụng script
```bash
cd be
node scripts/cleanup-firebase-users.js user@example.com
```

## Cách 3: Xóa tất cả users không có trong MongoDB

```bash
cd be
node scripts/cleanup-firebase-users.js --all
```

## Lưu ý

⚠️ **Quan trọng:**
- Khi xóa user trong Firebase Console, user sẽ không thể đăng nhập được nữa
- Nếu user đã tồn tại trong MongoDB, bạn cũng nên xóa trong MongoDB để đồng bộ
- Xóa trong Firebase Console sẽ không tự động xóa trong MongoDB

## Khi nào nên xóa thủ công?

✅ **Nên xóa thủ công khi:**
- Chỉ có vài users cần xóa
- Muốn kiểm tra từng user trước khi xóa
- Cần xem thông tin chi tiết của user trước khi xóa

✅ **Nên dùng script/API khi:**
- Cần xóa nhiều users
- Cần cleanup tự động
- Muốn đồng bộ với MongoDB

## Troubleshooting

### Không tìm thấy user trong Firebase Console?
- Kiểm tra xem bạn đã chọn đúng project chưa
- Kiểm tra xem user có tồn tại trong Firebase Authentication không (có thể đã bị xóa rồi)

### Xóa xong nhưng vẫn báo email đã được sử dụng?
- Đợi vài giây để Firebase sync
- Refresh lại trang đăng ký
- Hoặc sử dụng endpoint cleanup để đảm bảo đã xóa hoàn toàn

