$(document).ready(function () {
    $("#selectYear").change(function () { 
        const year = $(this).val();
        if(year == "all") {
            window.location.href = "/blog";
        }
        else {
            window.location.href = "/blog/" + year;
        }        
    });     
});