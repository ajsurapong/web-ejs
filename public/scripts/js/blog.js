$(document).ready(function () {
    // changing year
    $("#selectYear").change(function () { 
        const year = $(this).val();
        if(year == "all") {
            window.location.href = "/blog";
        }
        else {
            window.location.href = "/blog/" + year;
        }        
    });
    
    // delete post
    $(".btnDelete").click(function () { 
        const postID = $(this).attr("postID");
        // alert(postID);
        Swal.fire({
            icon: "warning",
            title: "Delete this post?",
            showCancelButton: true,
            confirmButtonText: "Yes",
        }).then(function(result) {
            if (result.isConfirmed) {
                $.ajax({
                    type: "DELETE",
                    url: "/blog/post/" + postID,
                    success: (data) => {
                        window.location.replace(data);
                    },
                    error: (xhr) => { 
                        Swal.fire({icon: "error", title: xhr.responseText});
                    }
                });
            }
        });                
    });
    
    //add new post
    $("#btnAdd").click(function () { 
        // show modal
        $("#modalAdd").modal("toggle");
    });

    // when add or edit
    var mode = "add";     //default is 'add'
    var postID = 0;       //required for editing
    $("#formAdd").submit(function (e) { 
        e.preventDefault();
        // close modal 
        $("#modalAdd").modal("toggle");

        //add or edit ?
        //'add' mode by default
        let method = "POST";        
        let data = {title: $("#txtTitle").val(), detail: $("#txtDetail").val()};
        //'edit'
        if(mode == "edit") {
            method = "PUT"; 
            data = {postID, title: $("#txtTitle").val(), detail: $("#txtDetail").val()};           
        }

        $.ajax({
            type: method,
            url: "/blog/post",  //same for both 'add' and 'edit'
            data: data,
            success: (result) => {
                window.location.replace(result);
            },
            error: (xhr) => { 
                Swal.fire({icon: "error", title: xhr.responseText});
            }
        });
    });

    //edit a post
    $(".btnEdit").click(function () { 
        // set mode to 'edit'
        mode = "edit";        

        // change modal title
        $("#modalTitle").text("Edit a post");
        // get old post data
        const postDetail = JSON.parse($(this).attr("postDetail"));
        // console.log(postDetail);

        //update postID for later use
        postID = postDetail.postID;
        //show old data
        $("#txtTitle").val(postDetail.title);
        $("#txtDetail").val(postDetail.detail);

        // show modal
        $("#modalAdd").modal("toggle");     
    });    
});