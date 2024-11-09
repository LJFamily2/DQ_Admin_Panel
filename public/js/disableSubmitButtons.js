$('form').submit(function(){
  $(this).find('button[type=submit]').prop('disabled', true);
  $(this).find('button[type=submit]').text('Đang xử lý...');
});