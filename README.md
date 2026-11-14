# Nhịp Cầu

Ứng dụng nhắn tin 1–1 dùng React, Vite và Supabase. Giao diện có đăng ký/đăng nhập, tìm bạn theo tên, lời mời kết bạn, danh sách bạn bè và tin nhắn thời gian thực.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Supabase project đã được cấu hình trong `src/lib/supabase.js`. Nếu muốn ghi đè cấu hình, tạo file `.env` từ `.env.example` rồi điền anon key thật vào biến `VITE_SUPABASE_ANON_KEY`.

## Thiết lập Supabase

1. Mở **SQL Editor** trong project Supabase `jxhgpnjmfijtkrzptavk`.
2. Mở và chạy toàn bộ [`supabase/schema.sql`](supabase/schema.sql).
3. Trong **Authentication → URL Configuration**, thêm URL GitHub Pages của repo vào **Site URL** và **Redirect URLs**.
4. Nếu bật xác nhận email, người dùng cần xác nhận email trước khi đăng nhập.

Schema tạo bảng hồ sơ, lời mời kết bạn, quan hệ bạn bè, cuộc trò chuyện và tin nhắn; đồng thời bật RLS và realtime cho tin nhắn. Chỉ chạy SQL trong project Supabase của ứng dụng này.

## Đưa lên GitHub Pages

Đẩy thư mục này lên nhánh `main`, sau đó vào **Settings → Pages** và chọn **GitHub Actions** làm nguồn deploy. Workflow `.github/workflows/deploy.yml` sẽ tự build và publish trang khi có commit mới.

Anon key được đặt trong frontend và là public key dành cho trình duyệt. Không đưa `service_role` key lên GitHub; quyền truy cập dữ liệu được giới hạn bởi các policy RLS trong schema.
