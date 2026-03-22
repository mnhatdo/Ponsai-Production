export interface ServiceItem {
  slug: string;
  category: string;
  title: string;
  shortDescription: string;
  detailDescription: string;
  image: string;
  highlights: string[];
  process: string[];
}

export const STAFF_ZALO_PHONE = '0960949378';

export const SERVICES: ServiceItem[] = [
  {
    slug: 'thiet-ke-khong-gian-xanh',
    category: 'Thiết kế',
    title: 'Thiết kế không gian xanh theo phong cách cá nhân',
    shortDescription: 'Khảo sát, lên concept và phối cảnh 3D cho sân vườn, ban công, góc làm việc.',
    detailDescription:
      'Dịch vụ giúp bạn biến không gian sống thành nơi thư giãn đúng gu. Đội ngũ Ponsai khảo sát thực tế, lên concept theo ngân sách, dựng phối cảnh và đề xuất danh mục cây phù hợp với ánh sáng, độ ẩm và mức độ chăm sóc mong muốn.',
    image: 'assets/images/post-1.jpg',
    highlights: [
      'Khảo sát trực tiếp hoặc online trong 24h',
      'Bản phối cảnh rõ ràng, dễ thi công',
      'Tối ưu chi phí theo ngân sách thực tế'
    ],
    process: [
      'Tiếp nhận nhu cầu & tư vấn sơ bộ',
      'Khảo sát vị trí, đo đạc và đánh giá ánh sáng',
      'Đề xuất concept, vật liệu và cây phù hợp',
      'Chốt phương án và bàn giao tài liệu thi công'
    ]
  },
  {
    slug: 'cham-soc-bao-duong-dinh-ky',
    category: 'Bảo dưỡng',
    title: 'Chăm sóc & bảo dưỡng cây định kỳ',
    shortDescription: 'Lịch chăm cây hàng tuần/hàng tháng với kỹ thuật viên chuyên nghiệp.',
    detailDescription:
      'Phù hợp cho văn phòng, quán cafe, gia đình bận rộn hoặc khách hàng mới chơi cây. Dịch vụ bao gồm kiểm tra sức khỏe cây, tưới – cắt tỉa – thay giá thể, xử lý sâu bệnh và báo cáo tình trạng sau mỗi lần bảo dưỡng.',
    image: 'assets/images/post-2.jpg',
    highlights: [
      'Gói linh hoạt theo tuần/tháng',
      'Báo cáo tình trạng cây sau mỗi lần chăm sóc',
      'Xử lý sâu bệnh an toàn, hạn chế hóa chất mạnh'
    ],
    process: [
      'Lập danh sách cây & tình trạng hiện tại',
      'Đề xuất lịch chăm sóc tối ưu',
      'Thực hiện bảo dưỡng định kỳ bởi kỹ thuật viên',
      'Theo dõi và điều chỉnh lịch theo mùa'
    ]
  },
  {
    slug: 'setup-cay-cho-doanh-nghiep',
    category: 'Doanh nghiệp',
    title: 'Setup cây xanh cho cửa hàng & doanh nghiệp',
    shortDescription: 'Triển khai trọn gói từ tư vấn, thi công đến vận hành cây xanh.',
    detailDescription:
      'Giải pháp dành cho thương hiệu cần không gian chuyên nghiệp và đồng bộ hình ảnh. Ponsai cung cấp gói thiết kế – thi công – vận hành trọn gói, tối ưu yếu tố thẩm mỹ, trải nghiệm khách hàng và chi phí vận hành dài hạn.',
    image: 'assets/images/post-3.jpg',
    highlights: [
      'Triển khai đồng bộ nhiều chi nhánh',
      'Quy trình rõ ràng, có timeline cụ thể',
      'Hỗ trợ vận hành sau bàn giao'
    ],
    process: [
      'Workshop nhu cầu thương hiệu',
      'Đề xuất mô hình setup phù hợp mặt bằng',
      'Thi công và bố trí cây theo timeline',
      'Bảo hành và vận hành sau triển khai'
    ]
  }
];
