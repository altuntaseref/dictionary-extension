# Admin Rolü Atama Rehberi

## Adım 1: Database Migration'ları Çalıştırın

Önce plan sistemi migration'ını çalıştırmanız gerekiyor:

1. Supabase Dashboard'a gidin
2. SQL Editor'ü açın
3. `backend/migrations_plans.sql` dosyasındaki SQL'i çalıştırın

## Adım 2: Admin Rolü Ata

### Yöntem 1: Email ile (Kolay)

1. Supabase Dashboard > SQL Editor
2. Aşağıdaki SQL'i çalıştırın (email'inizi değiştirin):

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Yöntem 2: User ID ile (Daha Güvenli)

1. Supabase Dashboard > Authentication > Users
2. Admin yapmak istediğiniz kullanıcıyı bulun
3. User ID'yi kopyalayın
4. SQL Editor'de çalıştırın:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_BURAYA', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

## Adım 3: Kontrol Edin

Admin rolünün atandığını kontrol etmek için:

```sql
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

## Admin Paneline Erişim

Admin rolü atandıktan sonra:

1. Uygulamaya giriş yapın
2. Sol menüden "Admin" linkine tıklayın
3. Admin paneli açılacak

## Notlar

- Admin rolü atandıktan sonra logout/login yapmanız gerekebilir
- Admin paneli sadece `admin` rolüne sahip kullanıcılar tarafından erişilebilir
- Birden fazla admin oluşturabilirsiniz

