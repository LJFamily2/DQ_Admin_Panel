document.addEventListener("DOMContentLoaded", function () {
    function initializeSlimSelect(selector) {
        new SlimSelect({
            select: selector,
            settings: {
                searchPlaceholder: 'Tìm kiếm...',
                searchText: 'Không có kết quả',
                searchingText: 'Tìm kiếm',
                placeholderText: 'Chọn khu vực',
            }
        });
    }

    initializeSlimSelect(".slim-select");
    initializeSlimSelect(".slim-select-multi");
});