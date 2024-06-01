document.addEventListener('DOMContentLoaded', function () {
  const slimSelectFields = document.querySelectorAll('.slim-select');

  slimSelectFields.forEach(function(field) {
    new SlimSelect({
      select: field,
    });
  }); 
});
