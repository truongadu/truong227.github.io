import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Lập Kế Hoạch Ăn Uống & Thực Đơn 7 Ngày | Facecook',
  description:
    'Lập kế hoạch ăn uống 7 ngày thông minh theo BMR, TDEE, mục tiêu calo, khẩu vị và dị ứng cá nhân hóa với AI.',
}

export default function MealPlannerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
