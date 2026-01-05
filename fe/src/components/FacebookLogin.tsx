import React, { useState } from 'react';
import { getAuth, signInWithPopup, FacebookAuthProvider, fetchSignInMethodsForEmail, GoogleAuthProvider, linkWithCredential, type User as FirebaseUser } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import api from '../services/api'; // axios instance


import type { User } from 'firebase/auth';

const FacebookLogin = () => {
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [manualEmail, setManualEmail] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const handleFacebookLogin = async (): Promise<void> => {
    const auth = getAuth();
    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Nếu không có email, luôn yêu cầu nhập email thủ công
      if (!user.email || user.email.trim() === '') {
        setPendingUser(user);
        setShowEmailForm(true);
        return;
      }
      let syncResult = false;
      // Nếu thiếu email, luôn yêu cầu nhập email thủ công
      if (!user.email || user.email.trim() === '') {
        setPendingUser(user);
        setShowEmailForm(true);
        return;
      } else {
        syncResult = await syncUserToBackend(user, user.email);
      }
      if (!syncResult) {
        // Nếu sync lỗi, giữ lại form nhập email để user có thể nhập lại
        setPendingUser(user);
        setShowEmailForm(true);
        return;
      }
      // ...chỉ cho flow thành công ở đây nếu sync thành công...
    } catch (err: unknown) {
      // Xử lý account linking nếu email đã tồn tại với provider khác
      const error = err as FirebaseError & { customData?: any };
      if (error.code === 'auth/account-exists-with-different-credential') {
        const auth = getAuth();
        const email = (error as any).customData?.email;
        const pendingCred = FacebookAuthProvider.credentialFromError(error as FirebaseError);
        if (!email) {
          alert('Không lấy được email từ Facebook.');
          return;
        }
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes('google.com')) {
          alert('Email này đã đăng ký bằng Google. Vui lòng đăng nhập Google trước để liên kết Facebook.');
          // Đăng nhập Google
          const googleProvider = new GoogleAuthProvider();
          try {
            const googleResult = await signInWithPopup(auth, googleProvider);
            if (pendingCred) {
              await linkWithCredential(googleResult.user, pendingCred);
            }
            // Gọi syncUserToBackend với user đã liên kết
            const syncResult = await syncUserToBackend(googleResult.user, googleResult.user.email ?? undefined);
            if (syncResult === false) return;
            alert('Đã liên kết Facebook với tài khoản Google thành công!');
          } catch (linkErr: unknown) {
            const linkError = linkErr as Error;
            alert('Lỗi khi liên kết tài khoản: ' + (linkError.message || ''));
          }
        } else if (methods.includes('password')) {
          alert('Email này đã đăng ký bằng Email/Password. Vui lòng đăng nhập bằng Email trước để liên kết Facebook.');
          // Có thể hướng dẫn user đăng nhập lại bằng email/password rồi liên kết
        } else {
          alert('Email này đã đăng ký bằng phương thức khác: ' + methods.join(', '));
        }
      } else {
        alert('Đăng nhập Facebook thất bại!');
      }
    }
  };

  const syncUserToBackend = async (user: User, emailOverride?: string): Promise<boolean> => {
    try {
      await api.post('/users/sync', {
        firebaseUid: user.uid,
        email: emailOverride || user.email,
        name: user.displayName,
        avatarUrl: '', // Để backend tự lấy avatar Facebook chuẩn
        providerId: 'facebook.com',
      });
      // Kiểm tra avatar Facebook có phải ảnh mặc định không
      const fbAvatarUrl = `https://graph.facebook.com/${user.uid}/picture?type=large`;
      // Tạo ảnh tạm để kiểm tra
      const img = new window.Image();
      img.onload = function () {
        // Facebook default avatar có kích thước 50x50
        if (img.naturalWidth === 50 && img.naturalHeight === 50) {
          alert('Facebook không cấp quyền lấy ảnh đại diện hoặc tài khoản không có avatar công khai. Vui lòng chọn ảnh đại diện khác sau khi đăng nhập.');
        }
      };
      img.src = fbAvatarUrl;
      return true;
    } catch (error: any) {
      // Hiển thị thông báo lỗi rõ ràng cho user
      alert(
        error?.response?.data?.message ||
        error?.message ||
        'Đồng bộ tài khoản thất bại. Vui lòng kiểm tra lại email hoặc thử lại.'
      );
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!pendingUser || !manualEmail) return;
    try {
      // Đảm bảo pendingUser là User, không phải null
      const user: FirebaseUser = pendingUser;
      await syncUserToBackend(user, manualEmail);
      setShowEmailForm(false);
      setManualEmail('');
      setPendingUser(null);
    } catch (error: any) {
      // Nếu sync thất bại, giữ nguyên form và báo lỗi
      alert(
        error?.response?.data?.message ||
        error?.message ||
        'Đồng bộ tài khoản thất bại. Vui lòng kiểm tra lại email hoặc thử lại.'
      );
    }
  };

  return (
    <div>
      <button onClick={handleFacebookLogin}>Đăng nhập Facebook</button>
      {showEmailForm && (
        <form onSubmit={handleEmailSubmit}>
          <label>
            Nhập email để hoàn tất đăng nhập:
            <input
              type="email"
              value={manualEmail}
              onChange={e => setManualEmail(e.target.value)}
              required
            />
          </label>
          <button type="submit">Xác nhận</button>
        </form>
      )}
    </div>
  );
};

export default FacebookLogin;
