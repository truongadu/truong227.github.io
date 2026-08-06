'use client'

import { useState } from 'react'
import { ChevronRight, LogIn, Search, Heart, Share2, Users, ShoppingCart, Plus, Store, ClipboardList, Trophy, Shield, User, DollarSign, Camera } from 'lucide-react'

interface FlowStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

interface UserFlow {
  name: string
  steps: FlowStep[]
  color: string
  icon: React.ReactNode
}

const flows: UserFlow[] = [
  {
    name: 'Xác thực người dùng',
    color: 'from-blue-500 to-blue-600',
    icon: <LogIn className="w-5 h-5" />,
    steps: [
      { id: '1-1', title: 'Truy cập trang web', description: 'Người dùng truy cập ứng dụng', icon: <LogIn className="w-5 h-5" /> },
      { id: '1-2', title: 'Chọn Đăng ký', description: 'Nhập email, password, tên', icon: <Plus className="w-5 h-5" /> },
      { id: '1-3', title: 'Xác thực tài khoản', description: 'Backend kiểm tra email trùng', icon: <LogIn className="w-5 h-5" /> },
      { id: '1-4', title: 'Đăng nhập thành công', description: 'Token lưu trong localStorage', icon: <LogIn className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Khám phá công thức',
    color: 'from-green-500 to-green-600',
    icon: <Search className="w-5 h-5" />,
    steps: [
      { id: '2-1', title: 'Xem danh sách công thức', description: 'Hiển thị tất cả công thức', icon: <Search className="w-5 h-5" /> },
      { id: '2-2', title: 'Tìm kiếm công thức', description: 'Lọc theo tên hoặc mô tả', icon: <Search className="w-5 h-5" /> },
      { id: '2-3', title: 'Xem chi tiết công thức', description: 'Hiển thị bước nấu, nguyên liệu', icon: <ChevronRight className="w-5 h-5" /> },
      { id: '2-4', title: 'Xem đánh giá & bình luận', description: 'Comments từ người dùng khác', icon: <Search className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Tương tác với công thức',
    color: 'from-red-500 to-red-600',
    icon: <Heart className="w-5 h-5" />,
    steps: [
      { id: '3-1', title: 'Thêm vào yêu thích', description: 'Lưu công thức yêu thích', icon: <Heart className="w-5 h-5" /> },
      { id: '3-2', title: 'Đánh giá công thức', description: 'Rating từ 1-5 sao', icon: <Heart className="w-5 h-5" /> },
      { id: '3-3', title: 'Viết bình luận', description: 'Chia sẻ trải nghiệm nấu ăn', icon: <Heart className="w-5 h-5" /> },
      { id: '3-4', title: 'Chia sẻ công thức', description: 'Gửi cho bạn bè', icon: <Share2 className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Quản lý bạn bè',
    color: 'from-purple-500 to-purple-600',
    icon: <Users className="w-5 h-5" />,
    steps: [
      { id: '4-1', title: 'Tìm kiếm bạn bè', description: 'Tìm người dùng khác', icon: <Users className="w-5 h-5" /> },
      { id: '4-2', title: 'Gửi lời mời', description: 'Yêu cầu kết bạn (pending)', icon: <Users className="w-5 h-5" /> },
      { id: '4-3', title: 'Chấp nhận/Từ chối', description: 'Phê duyệt lời mời', icon: <Users className="w-5 h-5" /> },
      { id: '4-4', title: 'Xem danh sách bạn', description: 'Quản lý danh bạ', icon: <Users className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Quản lý danh sách mua sắm',
    color: 'from-yellow-500 to-yellow-600',
    icon: <ShoppingCart className="w-5 h-5" />,
    steps: [
      { id: '5-1', title: 'Tạo danh sách mới', description: 'Đặt tên cho danh sách', icon: <ShoppingCart className="w-5 h-5" /> },
      { id: '5-2', title: 'Thêm nguyên liệu', description: 'Chọn từ công thức hoặc thêm thủ công', icon: <Plus className="w-5 h-5" /> },
      { id: '5-3', title: 'Chỉnh sửa mục', description: 'Cập nhật số lượng, ghi chú', icon: <ShoppingCart className="w-5 h-5" /> },
      { id: '5-4', title: 'Đánh dấu đã mua', description: 'Tick khi mua được', icon: <ShoppingCart className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Chợ & Bán hàng',
    color: 'from-orange-500 to-orange-600',
    icon: <Store className="w-5 h-5" />,
    steps: [
      { id: '6-1', title: 'Xem chợ', description: 'Duyệt sản phẩm đang bán', icon: <Store className="w-5 h-5" /> },
      { id: '6-2', title: 'Tạo sản phẩm', description: 'Chọn recipe làm sản phẩm bán', icon: <Plus className="w-5 h-5" /> },
      { id: '6-3', title: 'Mua hàng', description: 'Đặt mua sản phẩm', icon: <ShoppingCart className="w-5 h-5" /> },
      { id: '6-4', title: 'Thanh toán', description: 'Chuyển khoản + gửi bằng chứng', icon: <DollarSign className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Quản lý đơn hàng',
    color: 'from-teal-500 to-teal-600',
    icon: <ClipboardList className="w-5 h-5" />,
    steps: [
      { id: '7-1', title: 'Xem đơn hàng', description: 'Tab Đã mua/Đã bán', icon: <ClipboardList className="w-5 h-5" /> },
      { id: '7-2', title: 'Gửi bằng chứng', description: 'Người mua paste link ảnh CK', icon: <Camera className="w-5 h-5" /> },
      { id: '7-3', title: 'Xác nhận đơn', description: 'Người bán xác nhận đã nhận tiền', icon: <ClipboardList className="w-5 h-5" /> },
      { id: '7-4', title: 'Cập nhật trạng thái', description: 'Đang giao → Hoàn thành/Hủy', icon: <ClipboardList className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Bảng xếp hạng',
    color: 'from-pink-500 to-pink-600',
    icon: <Trophy className="w-5 h-5" />,
    steps: [
      { id: '8-1', title: 'Xem bảng xếp hạng', description: '4 tab: ratings, favorites, best-selling, master-chef', icon: <Trophy className="w-5 h-5" /> },
      { id: '8-2', title: 'Podium top 3', description: 'Hiển thị 3 vị trí dẫn đầu', icon: <Trophy className="w-5 h-5" /> },
      { id: '8-3', title: 'Lọc theo kỳ', description: 'All / Tuần / Tháng', icon: <Trophy className="w-5 h-5" /> },
      { id: '8-4', title: 'Master Chef', description: 'Xếp hạng tổng thể người bán', icon: <Trophy className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Quản trị Admin',
    color: 'from-slate-700 to-slate-900',
    icon: <Shield className="w-5 h-5" />,
    steps: [
      { id: '9-1', title: 'Dashboard', description: 'Thống kê người dùng, công thức, đơn hàng', icon: <Shield className="w-5 h-5" /> },
      { id: '9-2', title: 'Duyệt bài', description: 'Phê duyệt/từ chối công thức', icon: <ClipboardList className="w-5 h-5" /> },
      { id: '9-3', title: 'Quản lý người dùng', description: 'Xóa người dùng vi phạm', icon: <Users className="w-5 h-5" /> },
      { id: '9-4', title: 'Từ cấm', description: 'CRUD từ ngữ bị cấm', icon: <Shield className="w-5 h-5" /> },
    ],
  },
  {
    name: 'Hồ sơ người dùng',
    color: 'from-indigo-500 to-indigo-600',
    icon: <User className="w-5 h-5" />,
    steps: [
      { id: '10-1', title: 'Xem hồ sơ', description: 'Avatar, rank, thống kê', icon: <User className="w-5 h-5" /> },
      { id: '10-2', title: 'Chỉnh sửa hồ sơ', description: 'Cập nhật avatar, tên, mật khẩu', icon: <User className="w-5 h-5" /> },
      { id: '10-3', title: 'Công thức của tôi', description: 'Danh sách công thức đã đăng', icon: <Search className="w-5 h-5" /> },
      { id: '10-4', title: 'Yêu thích của tôi', description: 'Công thức đã lưu', icon: <Heart className="w-5 h-5" /> },
    ],
  },
]

export default function UserFlowPage() {
  const [selectedFlow, setSelectedFlow] = useState<string>(flows[0].name)

  const currentFlow = flows.find((f) => f.name === selectedFlow)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">User Flow</h1>
          <p className="text-muted-foreground">Các quy trình chính của ứng dụng Cooking App</p>
        </div>

        {/* Flow Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
          {flows.map((flow) => (
            <button
              key={flow.name}
              onClick={() => setSelectedFlow(flow.name)}
              className={`p-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                selectedFlow === flow.name
                  ? `bg-gradient-to-r ${flow.color} text-white shadow-lg`
                  : 'bg-card border border-border hover:border-foreground/50'
              }`}
            >
              <span className="shrink-0">{flow.icon}</span>
              <span className="text-left leading-tight">{flow.name}</span>
            </button>
          ))}
        </div>

        {/* Flow Diagram */}
        {currentFlow && (
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex overflow-x-auto gap-4 pb-4">
              {currentFlow.steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className={`flex flex-col items-center justify-center w-48 h-40 bg-gradient-to-br ${currentFlow.color} text-white rounded-lg shadow-md`}>
                    <div className="text-3xl mb-2">{step.icon}</div>
                    <h3 className="font-semibold text-center text-sm px-2">{step.title}</h3>
                    <p className="text-xs text-center mt-1 opacity-90 px-2">{step.description}</p>
                  </div>
                  {index < currentFlow.steps.length - 1 && (
                    <div className="flex-shrink-0 mx-4 flex items-center justify-center">
                      <ChevronRight className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flow Details */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {currentFlow && (
            <>
              <div>
                <h2 className="text-2xl font-bold mb-4">Mô tả chi tiết</h2>
                <div className="space-y-4">
                  {currentFlow.steps.map((step) => (
                    <div key={step.id} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r ${currentFlow.color} flex items-center justify-center text-white`}>
                          {step.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Tổng quan flow</h2>
                <div className={`bg-gradient-to-br ${currentFlow.color} text-white rounded-lg p-6 space-y-4`}>
                  <div>
                    <p className="text-sm opacity-90">Tên flow</p>
                    <p className="text-lg font-semibold">{currentFlow.name}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Số bước</p>
                    <p className="text-lg font-semibold">{currentFlow.steps.length} bước</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Mục đích</p>
                    <p className="text-sm leading-relaxed opacity-90">
                      {currentFlow.name === 'Xác thực người dùng' && 'Cho phép người dùng tạo tài khoản và đăng nhập vào hệ thống'}
                      {currentFlow.name === 'Khám phá công thức' && 'Giúp người dùng tìm kiếm và xem chi tiết các công thức nấu ăn'}
                      {currentFlow.name === 'Tương tác với công thức' && 'Cho phép người dùng đánh giá, bình luận và chia sẻ công thức'}
                      {currentFlow.name === 'Quản lý bạn bè' && 'Kết nối người dùng với bạn bè để chia sẻ công thức'}
                      {currentFlow.name === 'Quản lý danh sách mua sắm' && 'Giúp người dùng lập và quản lý danh sách mua sắm nguyên liệu'}
                      {currentFlow.name === 'Chợ & Bán hàng' && 'Cho phép người dùng mua bán sản phẩm ẩm thực'}
                      {currentFlow.name === 'Quản lý đơn hàng' && 'Theo dõi và cập nhật trạng thái đơn hàng'}
                      {currentFlow.name === 'Bảng xếp hạng' && 'Xem bảng xếp hạng công thức và người bán theo nhiều tiêu chí'}
                      {currentFlow.name === 'Quản trị Admin' && 'Quản lý toàn bộ hệ thống từ người dùng, công thức, đến từ cấm'}
                      {currentFlow.name === 'Hồ sơ người dùng' && 'Xem và chỉnh sửa thông tin cá nhân, rank, công thức yêu thích'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
