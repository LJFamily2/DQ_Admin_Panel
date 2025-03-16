module.exports = {
  renderPage,
};

async function renderPage(req, res) {
  try {
    // Define the manual sections (content will be added later)
    const manualSections = [
      // Introduction
      {
        id: "introduction",
        title: "Giới thiệu",
        content: `
        <h4>Giới thiệu về DQ Admin Panel</h4>
        
        <p>DQ Admin Panel là hệ thống quản lý toàn diện được thiết kế để hỗ trợ việc điều hành các hoạt động liên quan đến sản xuất và kinh doanh mủ cao su. Hệ thống này cung cấp các tính năng giúp quản lý dữ liệu một cách hiệu quả, từ thu thập nguyên liệu đến theo dõi hợp đồng và báo cáo kết quả.</p>
        
        <h5>Các tính năng chính</h5>
        <ul>
          <li><strong>Quản lý dữ liệu hàng ngày:</strong> Thu thập và theo dõi dữ liệu từ các vườn và nhà cung cấp theo ngày.</li>
          <li><strong>Quản lý nhà vườn:</strong> Lưu trữ thông tin chi tiết về các nhà vườn, diện tích, và thông tin liên hệ.</li>
          <li><strong>Quản lý hợp đồng bán mủ:</strong> Tạo và theo dõi các hợp đồng mua bán với khách hàng.</li>
          <li><strong>Theo dõi sản phẩm:</strong> Quản lý quy trình chạy lò và sản xuất thành phẩm.</li>
          <li><strong>Quản lý chi tiêu:</strong> Ghi nhận và theo dõi các khoản chi phí phát sinh.</li>
          <li><strong>Báo cáo và thống kê:</strong> Xuất báo cáo tổng hợp theo nhiều tiêu chí khác nhau.</li>
          <li><strong>Quản lý tài khoản:</strong> Phân quyền và quản lý người dùng theo vai trò.</li>
          <li><strong>Nhập/xuất dữ liệu:</strong> Hỗ trợ nhập và xuất dữ liệu thông qua tệp Excel.</li>
        </ul>
        
        <h5>Cấu trúc hệ thống</h5>
        <p>Hệ thống được chia thành các module chính sau:</p>
        <ul>
          <li><strong>Tổng quan:</strong> Hiển thị thông tin tổng hợp và biểu đồ thống kê.</li>
          <li><strong>Quản lý dữ liệu:</strong> Bao gồm dữ liệu nguyên liệu thô và chạy lò.</li>
          <li><strong>Dữ liệu hàng ngày:</strong> Quản lý thông tin thu mua mủ hàng ngày theo từng vườn.</li>
          <li><strong>Quản lý hợp đồng:</strong> Quản lý các hợp đồng bán mủ với khách hàng.</li>
          <li><strong>Chi tiêu:</strong> Quản lý các khoản chi phí phát sinh.</li>
          <li><strong>Nhật ký hoạt động:</strong> Ghi lại mọi thao tác trên hệ thống để tiện theo dõi.</li>
        </ul>
        
        <h5>Các loại mủ được quản lý</h5>
        <p>Hệ thống hỗ trợ quản lý các loại mủ cao su sau:</p>
        <ul>
          <li><strong>Mủ nước:</strong> Mủ tươi, tính theo khối lượng và hàm lượng.</li>
          <li><strong>Mủ tạp:</strong> Mủ có tạp chất, tính theo khối lượng.</li>
          <li><strong>Mủ ké:</strong> Loại mủ đặc biệt, tính theo khối lượng và hàm lượng.</li>
          <li><strong>Mủ đông:</strong> Mủ đã đông cứng, tính theo khối lượng.</li>
        </ul>
        
        <p>Để sử dụng hiệu quả hệ thống, vui lòng tham khảo các phần hướng dẫn chi tiết trong tài liệu này.</p>
        <!-- Có thể chèn hình ảnh ở đây sau -->
        <!-- <div class="text-center my-3">
          <img src="/images/manual/system_overview.png" alt="Tổng quan hệ thống" class="img-fluid rounded shadow" style="max-width: 100%; height: auto;">
          <p class="text-muted mt-2">Hình 1: Tổng quan về hệ thống DQ Admin Panel</p>
        </div> -->
      `,
      },
      // Login and Security
      {
        id: "login",
        title: "Đăng nhập và Bảo mật",
        content: `
        <h4>Đăng nhập và Bảo mật</h4>
        
        <p>Hệ thống DQ Admin Panel yêu cầu đăng nhập để đảm bảo tính bảo mật và phân quyền hợp lý giữa các người dùng. Mỗi tài khoản được gán một vai trò cụ thể với các quyền hạn khác nhau.</p>
        
        <h5>Truy cập hệ thống</h5>
        <p>Để truy cập hệ thống, bạn cần:</p>
        <ol>
          <li>Mở trình duyệt web (khuyến nghị sử dụng Chrome, Firefox hoặc Edge phiên bản mới nhất)</li>
          <li>Nhập địa chỉ URL của hệ thống vào thanh địa chỉ: <code>https://dqinventory.com/dang-nhap</code></li>
          <li>Bạn sẽ được chuyển hướng đến trang đăng nhập tại đường dẫn
        </ol>
        
        <h5>Các bước đăng nhập</h5>
        <ol>
          <li>Tại trang đăng nhập, nhập tên tài khoản của bạn vào trường "Tài khoản"</li>
          <li>Nhập mật khẩu vào trường "Mật khẩu"</li>
          <li>Nếu muốn hệ thống ghi nhớ đăng nhập trong 30 ngày, hãy đánh dấu vào ô "Ghi nhớ 30 ngày"</li>
          <li>Nhấn nút "Đăng nhập"</li>
        </ol>
        
        <div class="alert alert-warning">
          <strong>Lưu ý:</strong> Hệ thống chỉ cho phép truy cập trong giờ làm việc (từ 7:00 đến 23:00). Ngoài thời gian này, bạn sẽ không thể đăng nhập.
        </div>
        
        <div class="alert alert-info">
          <strong>Mẹo:</strong> Sau khi đăng nhập thành công, hệ thống sẽ chuyển hướng bạn đến trang phù hợp với vai trò của bạn:
          <ul>
            <li>Admin: Trang Tổng quan (<code>/tong</code>)</li>
            <li>Văn phòng: Trang Dữ liệu hàng ngày (<code>/du-lieu-hang-ngay</code>)</li>
            <li>Hàm lượng: Trang Thêm nguyên liệu (<code>/nhap-du-lieu/nguyen-lieu</code>)</li>
          </ul>
        </div>
        
        <h5>Quản lý thông tin tài khoản</h5>
        <p>Sau khi đăng nhập, bạn có thể thay đổi thông tin tài khoản của mình:</p>
        
        <h6>Cách thay đổi thông tin tài khoản:</h6>
        <ol>
          <li>Nhấp vào biểu tượng tài khoản <i class="ri-account-circle-line"></i> ở góc trên bên phải màn hình</li>
          <li>Chọn "Hồ sơ cá nhân" từ menu xổ xuống (đường dẫn: <code>/ho-so</code>)</li>
          <li>Tại trang Hồ sơ cá nhân, bạn có thể:
            <ul>
              <li>Thay đổi tên tài khoản: Chỉnh sửa trường "Tài khoản" và nhấn "Lưu"</li>
              <li>Đổi mật khẩu: Nhấp vào liên kết "Đổi mật khẩu" và làm theo các bước sau:
                <ol>
                  <li>Nhập mật khẩu hiện tại vào trường "Mật khẩu cũ"</li>
                  <li>Nhập mật khẩu mới (tối thiểu 8 ký tự) vào trường "Mật khẩu mới"</li>
                  <li>Nhập lại mật khẩu mới để xác nhận</li>
                  <li>Nhấn nút "Lưu" để hoàn tất việc đổi mật khẩu</li>
                </ol>
              </li>
            </ul>
          </li>
        </ol>
        
        <h5>Đăng xuất</h5>
        <p>Để bảo mật tài khoản, hãy đăng xuất khi không sử dụng hệ thống:</p>
        <ol>
          <li><strong>Cách 1:</strong> Nhấp vào biểu tượng tài khoản ở góc trên bên phải và chọn "Đăng xuất" từ menu xổ xuống</li>
          <li><strong>Cách 2:</strong> Nhấp vào nút "Đăng xuất" ở menu bên trái (trên màn hình máy tính)</li>
        </ol>
        
        <div class="alert alert-warning">
          <strong>Quan trọng:</strong> Để đảm bảo an ninh, hệ thống sẽ tự động đăng xuất sau một thời gian không hoạt động. Hãy lưu công việc của bạn thường xuyên để tránh mất dữ liệu.
        </div>
        
        <!-- Có thể chèn hình ảnh hướng dẫn đăng nhập ở đây -->
        <!-- <div class="text-center my-3">
          <img src="/images/manual/login_screen.png" alt="Màn hình đăng nhập" class="img-fluid rounded shadow" style="max-width: 100%; height: auto;">
          <p class="text-muted mt-2">Hình 1: Màn hình đăng nhập của hệ thống</p>
        </div> -->
        `,
      },
      // Raw Material
      {
        id: "raw-material",
        title: "Dữ liệu tổng",
        content: `
        <h4>Quản lý Dữ liệu Tổng</h4>
        
        <p>Module dữ liệu tổng cho phép bạn quản lý thông tin về các nguyên liệu thô đầu vào. Đây là nơi bạn có thể nhập liệu và theo dõi tất cả nguyên liệu mủ cao su được thu mua khi được đưa về nhà máy.</p>
        
        <h5>Truy cập trang dữ liệu tổng</h5>
        <p>Để truy cập trang quản lý dữ liệu tổng, bạn cần:</p>
        <ol>
          <li>Đăng nhập vào hệ thống</li>
          <li>Từ menu bên trái, chọn "Dữ liệu tổng", hoặc truy cập đường dẫn <code>/quan-ly-du-lieu</code></li>
        </ol>
        
        <h5>Các chức năng chính</h5>
        
        <h6>1. Nhập dữ liệu mới</h6>
        <ol>
          <li>Nhìn qua phần nhập liệu tại cột bên phảiphải</li>
          <li>Điền thông tin vào form bao gồm:
            <ul>
              <li>Ngày nhập liệu</li>
              <li>Thông tin mủ khô (số lượng, phần trăm hàm lượng)</li>
              <li>Thông tin mủ tạp (số lượng)</li>
              <li>Thông tin mủ kéké (số lượng, phần trăm hàm lượng)</li>
              <li>Ghi chú (nếu có)</li>
            </ul>
          </li>
          <li>Nhấn "Tạo" để hoàn tất việc nhập liệu</li>
        </ol>
        
        <h6>2. Chỉnh sửa dữ liệu</h6>
        <ol>
          <li>Tìm dữ liệu cần chỉnh sửa trong bảng</li>
          <li>Nhấn vào biểu tượng bút chì (chỉnh sửa) ở cột cuối cùng</li>
          <li>Thay đổi thông tin cần thiết trong form chỉnh sửa</li>
          <li>Nhấn "Lưu" để cập nhật thông tin</li>
        </ol>
        
        <h6>3. Xóa dữ liệu</h6>
        <ol>
          <li>Tìm dữ liệu cần xóa trong bảng</li>
          <li>Nhấn vào biểu tượng thùng rác (xóa) ở cột cuối cùng</li>
          <li>Xác nhận việc xóa trong hộp thoại hiện ra</li>
        </ol>
        
        <h6>4. Lọc và tìm kiếm</h6>
        <ol>
          <li>Sử dụng ô tìm kiếm ở góc trên bên phải của bảng để lọc dữ liệu theo từ khóa</li>
          <li>Để lọc theo khoảng ngày, sử dụng chức năng "Từ ngày - đến ngày" và nhấn "Lọc"</li>
          <li>Để xóa bộ lọc, nhấn nút "X"</li>
        </ol>
        
        <h6>5. Nhập dữ liệu từ Excel</h6>
        <ol>
          <li>Nhấn nút "Nhập Excel" ở phía trên bảng dữ liệu</li>
          <li>Tải xuống mẫu Excel nếu cần (bằng cách nhấn "Tải mẫu Excel")</li>
          <li>Chọn file Excel đã điền thông tin</li>
          <li>Nhấn "Tải lên" để tiến hành nhập dữ liệu</li>
        </ol>
        
        <div class="alert alert-warning">
          <strong>Lưu ý:</strong> Các thao tác thêm, sửa, xóa dữ liệu sẽ được ghi lại trong nhật ký hoạt động của hệ thống.
        </div>
        `,
      },
      // Product
      {
        id: "product",
        title: "Chạy lò",
        content: `
        <h4>Quản lý Chạy Lò</h4>
        
        <p>Module quản lý chạy lò giúp bạn theo dõi quá trình sản xuất mủ cao su, từ nguyên liệu đầu vào đến sản phẩm cuối cùng trong nhà máy.</p>
        
        <h5>Truy cập trang quản lý chạy lò</h5>
        <p>Để truy cập trang quản lý chạy lò, bạn cần:</p>
        <ol>
          <li>Đăng nhập vào hệ thống</li>
          <li>Từ menu bên trái, chọn "Chạy lò", hoặc truy cập đường dẫn <code>/quan-ly-hang-hoa</code></li>
        </ol>
        
        <h5>Các chức năng chính</h5>
        
        <h6>1. Thêm mới dữ liệu chạy lò</h6>
        <ol>
          <li>Nhìn qua cột nhập liệu bên phải</li>
          <li>Điền các thông tin cần thiết:
            <ul>
              <li>Ngày chạy lò</li>
              <li>Số lượng mủ nước sử dụng (kg)</li>
              <li>Hàm lượng mủ nước (%)</li>
              <li>Số lượng sản phẩm (kg)</li>
              <li>Ghi chú (nếu có)</li>
            </ul>
          </li>
          <li>Nhấn "Tạo" để hoàn tất việc thêm mới</li>
        </ol>
        
        <h6>2. Chỉnh sửa thông tin chạy lò</h6>
        <ol>
          <li>Tìm đợt chạy lò cần chỉnh sửa trong bảng</li>
          <li>Nhấn vào biểu tượng chỉnh sửa (bút chì) ở cột cuối</li>
          <li>Cập nhật thông tin trong form hiện ra</li>
          <li>Nhấn "Lưu" để cập nhật thông tin</li>
        </ol>
        
        <h6>3. Xóa dữ liệu chạy lò</h6>
        <ol>
          <li>Tìm đợt chạy lò cần xóa</li>
          <li>Nhấn vào biểu tượng xóa (thùng rác) ở cột cuối</li>
          <li>Xác nhận việc xóa trong hộp thoại hiện ra</li>
        </ol>
        
        <h6>4. Lọc và tìm kiếm</h6>
        <ol>
          <li>Sử dụng ô tìm kiếm để lọc dữ liệu theo từ khóa</li>
          <li>Để lọc theo khoảng thời gian, sử dụng bộ lọc ngày và nhấn "Lọc"</li>
          <li>Để xóa bộ lọc, nhấn "X"</li>
        </ol>
        
        <h6>5. Nhập dữ liệu từ Excel</h6>
        <ol>
          <li>Nhấn nút "Nhập Excel" trên trang</li>
          <li>Tải xuống mẫu Excel nếu cần</li>
          <li>Chọn file Excel đã điền thông tin</li>
          <li>Nhấn "Tải lên" để tiến hành nhập dữ liệu</li>
        </ol>
        
        <div class="alert alert-info">
          <strong>Thông tin:</strong> Hệ thống sẽ tự động tính toán lượng mủ quy khô dựa trên hàm lượng và số lượng mủ nhập vào. Bạn có thể theo dõi hiệu suất chạy lò thông qua tỷ lệ giữa sản phẩm đầu ra và nguyên liệu đầu vào.
        </div>
        
        <div class="alert alert-warning">
          <strong>Lưu ý:</strong> Khi xóa dữ liệu chạy lò, hệ thống sẽ tự động điều chỉnh lại số liệu trong báo cáo tổng hợp.
        </div>
        `,
      },
      // Sales
      {
        id: "contracts",
        title: "Quản lý Hợp đồng",
        content: `
        <h4>Quản lý Hợp đồng</h4>
        
        <p>Module quản lý hợp đồng giúp theo dõi các hợp đồng bán mủ cho khách hàng. Đây là nơi quản lý toàn bộ quá trình từ tạo hợp đồng và thanh toán.</p>
        
        <h5>Truy cập trang quản lý hợp đồng</h5>
        <p>Để truy cập trang quản lý hợp đồng, bạn cần:</p>
        <ol>
          <li>Đăng nhập vào hệ thống</li>
          <li>Từ menu bên trái, chọn "Hợp đồng", hoặc truy cập đường dẫn <code>/quan-ly-hop-dong</code></li>
        </ol>
        
        <h5>Các chức năng chính</h5>
        
        <h6>1. Tạo hợp đồng mới</h6>
        <ol>
          <li>Nhìn qua cột nhập liệu bên phải</li>
          <li>Điền thông tin hợp đồng vào form:
            <ul>
              <li>Mã hợp đồng</li>
              <li>Ngày ký</li>
              <li>Loại sản phẩm (mủ khô, mủ tạp, mủ ké)</li>
              <li>Số lượng (kg)</li>
              <li>Giá (VNĐ/kg)</li>
              <li>Ghi chú (nếu có)</li>
            </ul>
          </li>
          <li>Nhấn "Tạo" để hoàn tất việc tạo hợp đồng</li>
        </ol>
        
        <h6>2. Quản lý trạng thái hợp đồng</h6>
        <ol>
          <li>Các trạng thái hợp đồng bao gồm:
            <ul>
              <li><span class="badge bg-success">Đang mở</span>: Đang mở</li>
              <li><span class="badge bg-danger">Đã đóng</span>: Đã đóng</li>
            </ul>
          </li>
          <li>Để cập nhật trạng thái: Nhấn vào biểu tượng chỉnh sửa và thay đổi trạng thái trong form</li>
        </ol>
        
        <h6>3. Thêm sản phẩm vào hợp đồng</h6>
        <ol>
          <li>Nhìn qua cột nhập liệu bên phải</li>
          <li>Chọn loại sản phẩm, nhập số lượng và giá</li>
          <li>Nhấn "Tạo" để thêm sản phẩm vào hợp đồng</li>
        </ol>
        
        <h6>5. Lọc và tìm kiếm hợp đồng</h6>
        <ol>
          <li>Sử dụng ô tìm kiếm để lọc theo mã hợp đồng hoặc ghi chú</li>
          <li>Sử dụng bộ lọc ngày để tìm hợp đồng trong khoảng thời gian cụ thể</li>
          <li>Lọc theo trạng thái để xem các hợp đồng mới, đang xử lý, hoàn thành hoặc đã hủy</li>
        </ol>
        
        <div class="alert alert-warning">
          <strong>Lưu ý:</strong> Chỉ người dùng có quyền Admin hoặc Văn phòng mới có thể tạo, chỉnh sửa hoặc hủy hợp đồng.
        </div>
        `,
      },
      // Spend
      {
        id: "spend",
        title: "Chi tiêu",
        content: `
        <h4>Quản lý Chi Tiêu</h4>
        
        <p>Module quản lý chi tiêu giúp theo dõi và quản lý các khoản chi phí phát sinh trong hoạt động kinh doanh của nhà máymáy.</p>
        
        <h5>Truy cập trang quản lý chi tiêu</h5>
        <p>Để truy cập trang quản lý chi tiêu, bạn cần:</p>
        <ol>
          <li>Đăng nhập vào hệ thống</li>
          <li>Từ menu bên trái, chọn "Chi tiêu", hoặc truy cập đường dẫn <code>/quan-ly-chi-tieu</code></li>
        </ol>
        
        <h5>Các chức năng chính</h5>
        
        <h6>1. Thêm khoản chi tiêu mới</h6>
        <ol>
          <li>Nhìn qua cột nhập liệu bên phải</li>
          <li>Điền thông tin chi tiêu vào form:
            <ul>
              <li>Ngày chi tiêu</li>
              <li>Loại chi tiêu (chọn từ danh sách có sẵn. Các trường nhập sẽ xuất hiện tùy vào loại chi tiêutiêu)</li>
              <li>Tên hàng hóa</li>
              <li>Số lượng</li>
              <li>Đơn giá</li>
              <li>Tổng tiền lương (nếu hàng loại chi tiêu là Lương)</li>
              <li>Ghi chú</li>
            </ul>
          </li>
          <li>Nhấn "Tạo" để hoàn tất việc thêm khoản chi tiêu</li>
        </ol>
        
        <h6>2. Chỉnh sửa khoản chi tiêu</h6>
        <ol>
          <li>Tìm khoản chi tiêu cần chỉnh sửa trong bảng</li>
          <li>Nhấn vào biểu tượng chỉnh sửa (bút chì) ở cột cuối</li>
          <li>Cập nhật thông tin trong form hiện ra</li>
          <li>Nhấn "Lưu" để cập nhật thông tin</li>
        </ol>
        
        <h6>3. Xóa khoản chi tiêu</h6>
        <ol>
          <li>Tìm khoản chi tiêu cần xóa</li>
          <li>Nhấn vào biểu tượng xóa (thùng rác) ở cột cuối</li>
          <li>Xác nhận việc xóa trong hộp thoại hiện ra</li>
        </ol>
        
        <h6>4. Lọc và thống kê chi tiêu</h6>
        <ol>
          <li>Sử dụng bộ lọc thời gian để xem chi tiêu trong khoảng ngày cụ thể</li>
        </ol>
        
        <h6>5. Nhập chi tiêu từ Excel</h6>
        <ol>
          <li>Nhấn nút "Nhập Excel" trên trang</li>
          <li>Tải xuống mẫu Excel nếu cần</li>
          <li>Điền thông tin vào file Excel</li>
          <li>Chọn file đã điền thông tin và nhấn "Tải lênlên" để tiến hành nhập dữ liệu</li>
        </ol>
        
        <h6>6. Xuất báo cáo chi tiêu</h6>
        <ol>
          <li>Sử dụng bộ lọc để chọn dữ liệu cần xuất</li>
          <li>Nhấn nút xuất dữ liệu (PDF, Excel, CSV) để tải báo cáo</li>
        </ol>
        
        <div class="alert alert-warning">
          <strong>Lưu ý về quyền hạn:</strong> Chỉ người dùng có quyền Admin hoặc Văn phòng mới có thể xóa hoặc chỉnh sửa các khoản chi tiêu đã được tạo.
        </div>
        `,
      },
      // Daily Data
      {
        id: "daily-data",
        title: "Dữ liệu ngày",
        content: `
        <h4>Quản lý Dữ Liệu Hàng Ngày</h4>
        
        <p>Module dữ liệu hàng ngày là nơi quản lý thông tin thu mua mủ cao su từ các nhà vườn theo từng ngày. Đây là module quan trọng giúp theo dõi nguyên liệu đầu vào chi tiết theo từng vườn và từng nhà cung cấp.</p>
        
        <h5>Truy cập trang dữ liệu hàng ngày</h5>
        <p>Để truy cập trang quản lý dữ liệu hàng ngày, bạn cần:</p>
        <ol>
          <li>Đăng nhập vào hệ thống</li>
          <li>Từ menu bên trái, chọn "Dữ liệu ngày", hoặc truy cập đường dẫn <code>/du-lieu-hang-ngay</code></li>
        </ol>
        
        <h5>Các chức năng chính</h5>
        
        <h6>1. Quản lý vườn</h6>
        <ol>
          <li>Xem danh sách vườn hiện có</li>
          <li>Nhìn qua cột nhập liệu bên phải</li>
          <li>Chỉnh sửa thông tin vườn: Nhấn vào tên vườn và chọn biểu tượng cây bút chì</li>
          <li>Xóa vườn: Nhấn vào biểu tượng xóa bên cạnh tên vườn</li>
        </ol>
        
        <h6>2. Xem chi tiết vườn</h6>
        <ol>
          <li>Nhấp vào tên vườn trong danh sách để xem thông tin chi tiết</li>
          <li>Tại trang chi tiết, bạn có thể thấy:
            <ul>
              <li>Thông tin cơ bản về vườn (diện tích, địa chỉ, v.v.)</li>
              <li>Danh sách nhà vườn thuộc vườn đó</li>
              <li>Dữ liệu thu mua hàng ngày</li>
            </ul>
          </li>
        </ol>
        
        <h6>3. Quản lý nhà vườn</h6>
        <ol>
          <li>Nhìn qua cột nhập liệu bên phải</li>
          <li>Chỉnh sửa thông tin nhà vườn: Nhấn vào biểu tượng chỉnh sửa</li>
          <li>Xóa nhà vườn: Nhấn vào biểu tượng xóa và xác nhận</li>
        </ol>
        
        <h6>4. Quản lý dữ liệu thu mua</h6>
        <ol>
          <li>Thêm dữ liệu: Truy cập <code>/nhap-du-lieu/nguyen-lieu/{slug-vuon}</code></li>
          <li>Cập nhật dữ liệu: Nhấn vào biểu tượng chỉnh sửa</li>
          <li>Xóa dữ liệu: Nhấn vào biểu tượng xóa</li>
        </ol>
        
        <h6>5. In và xuất dữ liệu</h6>
        <p><strong>Xuất dữ liệu cho toàn bộ vườn:</strong></p>
        <ol>b
          <li>Truy cập trang xuất dữ liệu của vườn tại <code>/du-lieu-hang-ngay/{slug-vuon}/xuat-du-lieu</code></li>
          <li>Sử dụng bộ lọc ngày để chọn khoảng thời gian cần xuất dữ liệu</li>
          <li>Nhấn vào một trong các nút xuất dữ liệu:
            <ul>
              <li><strong>In</strong>: Để in trực tiếp bảng dữ liệu hiện tại</li>
              <li><strong>Excel</strong>: Để xuất dữ liệu dạng tệp Excel (.xlsx)</li>
              <li><strong>CSV</strong>: Để xuất dữ liệu dạng tệp CSV</li>
              <li><strong>PDF</strong>: Để xuất dữ liệu dạng tệp PDF</li>
              <li><strong>In tất cả</strong>: Để xuất báo cáo tổng hợp cho tất cả nhà vườn</li>
            </ul>
          </li>
          <li>Khi sử dụng chức năng "In tất cả", hệ thống sẽ mở trang mới hiển thị báo cáo chi tiết cho tất cả các nhà vườn, được tự động chia trang cho việc in ấn</li>
        </ol>
        
        <p><strong>Xuất dữ liệu cho một nhà vườn cụ thể:</strong></p>
        <ol>
          <li>Tại trang chi tiết vườn, nhấn vào tên nhà vườn cần xuất dữ liệu</li>
          <li>Hoặc truy cập đường dẫn <code>/du-lieu-hang-ngay/{slug-vuon}/xuat-du-lieu-nha-vuon/{slug-nha-vuon}</code></li>
          <li>Sử dụng bộ lọc ngày để chọn khoảng thời gian</li>
          <li>Nhấn nút "In" hoặc chọn định dạng xuất (Excel, CSV, PDF)</li>
          <li>Tại đây bạn cũng có thể:
            <ul>
              <li>Cập nhật giá cho nhà vườn trong khoảng thời gian đã chọn</li>
              <li>Xem số dư còn nợ và số tiền đã giữ lại</li>
            </ul>
          </li>
        </ol>
        
        <div class="alert alert-info">
          <strong>Mẹo:</strong> Khi in dữ liệu, bạn có thể thay đổi cài đặt in trong trình duyệt để điều chỉnh kích thước giấy, lề và các tùy chọn khác cho phù hợp với nhu cầu.
        </div>
        `,
      },
      // Reports
      {
        id: "reports",
        title: "Xuất Báo cáo",
        content: `
        <h4>Xuất Báo Cáo</h4>
        
        <p>Hệ thống DQ Admin Panel cung cấp nhiều tính năng xuất báo cáo để hỗ trợ trong việc phân tích dữ liệu và đưa ra quyết định kinh doanh. Bạn có thể xuất báo cáo từ hầu hết các module trong hệ thống.</p>
        
        <h5>Các loại báo cáo chính</h5>
        
        <h6>1. Báo cáo tổng hợp từ trang Tổng quan</h6>
        <ol>
          <li>Truy cập trang Tổng quan (<code>/tong</code>)</li>
          <li>Xem biểu đồ thống kê theo tháng</li>
          <li>Nhấn vào biểu tượng tải xuống ở góc trên bên phải của mỗi biểu đồ để tải biểu đồ dưới dạng hình ảnh</li>
          <li>Sử dụng chức năng "In trang" để in toàn bộ trang tổng quan với các biểu đồ và số liệu</li>
        </ol>
        
        <h6>2. Báo cáo dữ liệu hàng ngày</h6>
        <ol>
          <li>Truy cập trang xuất dữ liệu của vườn (<code>/du-lieu-hang-ngay/{slug-vuon}/xuat-du-lieu</code>)</li>
          <li>Sử dụng các tùy chọn xuất dữ liệu:
            <ul>
              <li><strong>In</strong>: Để in trực tiếp bảng dữ liệu hiện tại</li>
              <li><strong>Excel</strong>: Để xuất dữ liệu dạng tệp Excel</li>
              <li><strong>CSV</strong>: Để xuất dữ liệu dạng tệp CSV</li>
              <li><strong>PDF</strong>: Để xuất dữ liệu dạng tệp PDF</li>
              <li><strong>In tất cả</strong>: Để xuất báo cáo tổng hợp cho tất cả nhà vườn</li>
            </ul>
          </li>
          <li>Nhấn "In tất cả" để xuất báo cáo chi tiết cho tất cả các nhà vườn, được tự động chia trang cho việc in</li>
        </ol>
        
        <h6>1. Lọc dữ liệu trước khi xuất báo cáo</h6>
        <ol>
          <li>Sử dụng các bộ lọc có sẵn trên mỗi trang để giới hạn dữ liệu hiển thị</li>
          <li>Lọc theo khoảng thời gian, loại dữ liệu, nhà vườn, v.v.</li>
          <li>Chỉ dữ liệu đã lọc sẽ được đưa vào báo cáo xuất ra</li>
        </ol>
        
        <h6>2. Tùy chỉnh định dạng khi in</h6>
        <ol>
          <li>Khi nhấn nút "In", hộp thoại in của trình duyệt sẽ hiển thị</li>
          <li>Điều chỉnh các tùy chọn in như:
            <ul>
              <li>Kích thước giấy (A4, Letter, v.v.)</li>
              <li>Hướng giấy (dọc hoặc ngang)</li>
              <li>Lề trang</li>
              <li>In có màu hay đen trắng</li>
              <li>Tỷ lệ (100% hoặc "Vừa với trang")</li>
            </ul>
          </li>
        </ol>
        
        <div class="alert alert-info">
          <strong>Mẹo:</strong> Khi xuất báo cáo cho các bảng có nhiều cột, hãy sử dụng hướng giấy ngang (landscape) để hiển thị đầy đủ thông tin mà không bị cắt.
        </div>
        
        <div class="alert alert-warning">
          <strong>Lưu ý:</strong> Các báo cáo xuất ra có thể chứa thông tin kinh doanh nhạy cảm. Hãy đảm bảo chỉ chia sẻ báo cáo với những người có thẩm quyền.
        </div>
        `,
      },
      // User Management
      {
        id: "user-management",
        title: "Quản lý Người dùng",
        content: `
        <h4>Quản lý Người Dùng</h4>
        
        <p>Module quản lý người dùng cho phép Admin tạo, chỉnh sửa, và quản lý các tài khoản người dùng trong hệ thống. Việc phân quyền hợp lý giúp đảm bảo an toàn dữ liệu và hiệu quả trong quản lý.</p>
        
        <h5>Truy cập trang quản lý người dùng</h5>
        <p>Để truy cập trang quản lý người dùng, bạn cần:</p>
        <ol>
          <li>Đăng nhập vào hệ thống với quyền Admin hoặc superAdmin</li>
          <li>Từ menu bên trái, chọn "Quản lý người dùng", hoặc truy cập đường dẫn <code>/quan-ly-nguoi-dung</code></li>
        </ol>
        
        <div class="alert alert-warning">
          <strong>Lưu ý:</strong> Chỉ người dùng có quyền Admin hoặc superAdmin mới có quyền truy cập vào module này.
        </div>
        
        <h5>Các chức năng chính</h5>
        
        <h6>1. Xem danh sách người dùng</h6>
        <ol>
          <li>Tại trang quản lý người dùng, bạn sẽ thấy bảng danh sách tất cả người dùng hiện có</li>
          <li>Bảng hiển thị thông tin: Tên tài khoản, Vai trò, Trạng thái, và các tùy chọn quản lý</li>
          <li>Sử dụng ô tìm kiếm để lọc người dùng theo tên hoặc vai trò</li>
        </ol>
        
        <h6>2. Thêm người dùng mới</h6>
        <ol>
          <li>Nhấn nút "Thêm người dùng" trên trang</li>
          <li>Điền thông tin vào form:
            <ul>
              <li>Tên tài khoản (username)</li>
              <li>Mật khẩu (tối thiểu 8 ký tự)</li>
              <li>Vai trò (Admin, Văn phòng, Hàm lượng, hoặc superAdmin)</li>
            </ul>
          </li>
          <li>Nhấn "Lưu" để tạo người dùng mới</li>
        </ol>
        
        <h6>3. Chỉnh sửa thông tin người dùng</h6>
        <ol>
          <li>Nhấn vào biểu tượng chỉnh sửa (bút chì) bên cạnh người dùng cần sửa</li>
          <li>Thay đổi thông tin cần thiết trong form</li>
          <li>Nhấn "Lưu" để cập nhật thông tin</li>
        </ol>
        
        <h6>4. Đặt lại mật khẩu</h6>
        <ol>
          <li>Nhấn vào biểu tượng khóa bên cạnh người dùng</li>
          <li>Nhập mật khẩu mới cho người dùng</li>
          <li>Nhấn "Lưu" để cập nhật mật khẩu</li>
        </ol>
        
        <h6>5. Khóa/Mở khóa tài khoản</h6>
        <ol>
          <li>Nhấn vào biểu tượng trạng thái (bật/tắt) bên cạnh người dùng</li>
          <li>Xác nhận hành động trong hộp thoại hiện ra</li>
          <li>Khi tài khoản bị khóa, người dùng sẽ không thể đăng nhập vào hệ thống</li>
        </ol>
        
        <h6>6. Xóa người dùng</h6>
        <ol>
          <li>Nhấn vào biểu tượng xóa (thùng rác) bên cạnh người dùng</li>
          <li>Xác nhận việc xóa trong hộp thoại cảnh báo</li>
          <li>Sau khi xóa, tài khoản sẽ không còn tồn tại trong hệ thống</li>
        </ol>
        
        <h5>Vai trò người dùng</h5>
        <p>Hệ thống có 4 vai trò người dùng với các quyền hạn khác nhau:</p>
        <ul>
          <li><strong>superAdmin:</strong> Có toàn quyền trên hệ thống, bao gồm quản lý người dùng và cài đặt hệ thống</li>
          <li><strong>Admin:</strong> Có quyền truy cập và chỉnh sửa hầu hết các module, trừ một số cài đặt hệ thống cao cấp</li>
          <li><strong>Văn phòng:</strong> Có quyền quản lý dữ liệu hàng ngày, hợp đồng, chi tiêu và xuất báo cáo</li>
          <li><strong>Hàm lượng:</strong> Chỉ có quyền nhập và chỉnh sửa dữ liệu về nguyên liệu và hàm lượng</li>
        </ul>
        
        <div class="alert alert-info">
          <strong>Thực hành tốt nhất:</strong> Tuân theo nguyên tắc "quyền tối thiểu cần thiết" - chỉ cấp cho người dùng những quyền họ thực sự cần để thực hiện công việc của mình.
        </div>
        
        <div class="alert alert-warning">
          <strong>Lưu ý về bảo mật:</strong> Người dùng có vai trò superAdmin có quyền cao nhất trong hệ thống. Hãy đảm bảo rằng chỉ những người thực sự có trách nhiệm mới được cấp quyền này và sử dụng mật khẩu mạnh.
        </div>
        `,
      },
    ];

    res.render("src/userManualPage", {
      layout: "./layouts/defaultLayout",
      title: "Hướng dẫn sử dụng hệ thống",
      user: req.user,
      manualSections,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error rendering user manual page:", error);
    res.status(500).render("partials/500", { layout: false });
  }
}
