document.addEventListener("DOMContentLoaded", function () {
    function initializeSlimSelect(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            new SlimSelect({
                select: element,
                settings: {
                    searchPlaceholder: 'Tìm kiếm...',
                    searchText: 'Không có kết quả',
                    searchingText: 'Tìm kiếm',
                    placeholderText: 'Chọn khu vực',
                }
            });
        });
    }

    initializeSlimSelect(".slim-select");
    initializeSlimSelect(".slim-select-multi");
});