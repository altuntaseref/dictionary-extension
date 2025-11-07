-- Admin rolü atama scripti
-- Bu scripti Supabase SQL Editor'de çalıştırın

-- 1. Önce user_roles tablosunun var olduğundan emin olun
-- (Eğer migrations_plans.sql çalıştırılmadıysa, önce onu çalıştırın)

-- 2. Admin rolü atamak için kullanıcının email'ini veya user_id'sini kullanın

-- Yöntem 1: Email ile admin rolü ata
-- Email'inizi buraya yazın
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Yöntem 2: User ID ile admin rolü ata (daha güvenli)
-- User ID'yi Supabase Dashboard > Authentication > Users'dan bulabilirsiniz
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('USER_ID_BURAYA', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Admin rolünü kontrol etmek için
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';

-- 4. Tüm rolleri görmek için
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.created_at DESC;

