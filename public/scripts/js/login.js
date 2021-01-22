$(document).ready(function () {
    $("#btnSignIn").click(function () { 
        const username = $("#txtUsername").val();
        const password = $("#txtPassword").val();
    
        $.ajax({
            method: "POST",
            url: "/login",
            data: { "username": username, "password": password},
            success: function (data) {
                alert(data);
                // window.location.replace(data);
            },
            error: function (xhr) {
                $("#alertMessage").text(xhr.responseText);
                $(".alert-danger").show().fadeOut(3000);
            }
        }); 
    });    
});