// Column configurations for different tables
const userColumns = [
    { data: 'no' },
    { data: 'created' },
    { data: 'username' },
    { data: 'email' },
    { data: 'id' }
];

initializeDataTable('#user-accounts', '/users/getUsers', '#staticBackdrop', userColumns);


function initializeDataTable(tableId, ajaxUrl, modalTarget, columns) {
    $(tableId).DataTable({
        dom: 'Bfrtip',
        serverSide: true,
        processing: true,
        buttons: [
            {
                extend: 'excelHtml5',
                autoFilter: true,
                sheetName: 'Exported data'
            }, 
            'csv'
        ],
        ajax: {
            url: ajaxUrl,
            type: 'POST',
        },
        columns: columns.map(column => {
            if (column.data === 'id') {
                return {
                    ...column,
                    render: function (data, type, row) {
                        return `
                            <i
                                class="ri-edit-box-line"
                                data-bs-toggle="modal"
                                data-bs-target="${modalTarget}${row.no}"
                                style="cursor: pointer;"
                            ></i>
                        `;
                    }
                };
            }
            return column;
        })
    });
}



