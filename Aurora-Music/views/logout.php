<?php
session_start();
session_unset();
session_destroy();

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script>
        history.replaceState(null, '', '/Aurora-Music/');
        window.location.replace('/Aurora-Music/');
    </script>
</head>
<body></body>
</html>