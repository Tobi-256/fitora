# Facebook Login & Account Linking - Notes

**Tóm tắt vấn đề & giải pháp:**

- Đăng nhập Facebook có thể không trả về email, cần yêu cầu user nhập email thủ công nếu thiếu.
- Nếu email Facebook trùng với Google hoặc đăng ký thủ công, backend sẽ hợp nhất tài khoản, không tạo user mới, giữ nguyên thông tin cá nhân.
- FE đã xử lý account linking, chỉ cho login thành công khi backend sync thành công (có email hợp lệ).
- Nếu sync thất bại (thiếu email), luôn hiện lại form nhập email cho user.
- Avatar Facebook có thể là ảnh mặc định nếu user không cấp quyền, FE sẽ cảnh báo và cho phép đổi avatar.
- Không cho phép đổi email trực tiếp trong Account Information (nếu muốn cần thêm chức năng xác thực).

**Ghi chú:**
- Nếu cần đổi tên cuộc trò chuyện, hãy tạo file note như thế này để lưu lại quyết định và luồng xử lý.
- Nếu cần hỗ trợ thêm, hãy gửi yêu cầu mới!
