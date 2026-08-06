import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thông báo - FaceCook',
  description: 'Trung tâm thông báo lượt thả tim và lời mời kết bạn trên FaceCook.',
}

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
