# Hướng dẫn cấu hình Facebook Login

## Vấn đề hiện tại

Lỗi: "The domain of this URL isn't included in the app's domains"

## Giải pháp

### Bước 1: Cấu hình Facebook App

1. **Truy cập Facebook Developers Console**
   - Vào: https://developers.facebook.com/
   - Đăng nhập và chọn app của bạn (App ID: `2812079475650853`)

2. **Thêm App Domains**
   - Vào **Settings** → **Basic**
   - Trong phần **App Domains**, thêm:
     ```
     localhost
     fitora-e1beb.firebaseapp.com
     ```
   - Click **Save Changes**

3. **Thêm Valid OAuth Redirect URIs**
   - Vào **Products** → **Facebook Login** → **Settings**
   - Trong phần **Valid OAuth Redirect URIs**, thêm:
     ```
     https://fitora-e1beb.firebaseapp.com/__/auth/handler
     http://localhost:5173
     http://localhost:3000
     ```
   - **Lưu ý**: Thêm cả `http://localhost:5173` (port của Vite dev server)
   - Click **Save Changes**

4. **Bật Web OAuth Login**
   - Trong cùng trang **Facebook Login Settings**
   - Đảm bảo **Web OAuth Login** được bật (ON)

### Bước 2: Kiểm tra Firebase Configuration

1. **Firebase Console**
   - Vào: https://console.firebase.google.com/
   - Chọn project: `fitora-e1beb`
   - Vào **Authentication** → **Sign-in method**
   - Click **Facebook**

2. **Cấu hình Facebook Provider**
   - **App ID**: `2812079475650853`
   - **App Secret**: `d74d56106c1fdcbbd1451ca021420968`
   - **OAuth Redirect URI**: `https://fitora-e1beb.firebaseapp.com/__/auth/handler`
   - Click **Save**

### Bước 3: Cấu hình Facebook App Settings

1. **Authorized Domains**
   - Vào **Settings** → **Basic** → **Add Platform** → **Website**
   - Site URL: `http://localhost:5173`
   - Thêm thêm: `https://fitora-e1beb.firebaseapp.com`

2. **Privacy Policy URL** (nếu cần)
   - Thêm Privacy Policy URL nếu Facebook yêu cầu

### Bước 4: Test lại

1. Restart backend và frontend
2. Thử login với Facebook
3. Kiểm tra console để xem có lỗi gì không

## Lưu ý quan trọng

⚠️ **Facebook App đang ở chế độ Development:**
- Chỉ có thể test với các tài khoản được thêm vào **Roles** → **Test Users**
- Để public, cần submit app để review

### Thêm Test Users:
1. Vào **Roles** → **Test Users**
2. Click **Add Test Users**
3. Thêm email của bạn để test

## Troubleshooting

### Lỗi: "URL Blocked"
- Kiểm tra lại OAuth Redirect URIs đã thêm đúng chưa
- Đảm bảo không có trailing slash hoặc sai protocol

### Lỗi: "App Not Setup"
- Kiểm tra App ID và App Secret trong Firebase Console
- Đảm bảo Facebook Login đã được bật trong Firebase

### Lỗi: "Invalid OAuth Access Token"
- Kiểm tra App Secret có đúng không
- Đảm bảo Facebook App đang ở chế độ Development hoặc đã được approve

## Tham khảo

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [Firebase Facebook Auth](https://firebase.google.com/docs/auth/web/facebook-login)

