<?php

/**
* Plugin Name: Google CI Calendar Integration
* Version: 1.3
* Description: Google Calendar integration
*/

function ci_calendar_shortcode() {
    $url =
  'https://calendar.google.com/calendar/ical/' .
  '7cd67ecc1e05891f0a89b08a145dca65102fb64fa16b18e4385f89895d2ac18f%40group.calendar.google.com' .
  '/public/basic.ics';

    $response = wp_remote_get($url);
    $ical = wp_remote_retrieve_body($response);

    $ver_css = filemtime(plugin_dir_path(__FILE__) . 'ci-calendar.css');
    $ver_js  = filemtime(plugin_dir_path(__FILE__) . 'ci-calendar.js');
    $ver_cc  = filemtime(plugin_dir_path(__FILE__) . 'country-codes.js');

    ob_start(); ?>
    <link rel="stylesheet" href="<?php echo esc_url(plugin_dir_url(__FILE__) . 'ci-calendar.css'); ?>?v=<?php echo $ver_css; ?>">
    <?php echo file_get_contents(plugin_dir_path(__FILE__) . 'ci-calendar.html'); ?>
    <script src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'country-codes.js'); ?>?v=<?php echo $ver_cc; ?>"></script>
    <script src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'ci-calendar.js'); ?>?v=<?php echo $ver_js; ?>"></script>
    <script>
        initCalendar(<?php echo json_encode($ical); ?>);
    </script>
    <?php return ob_get_clean();
}

add_shortcode('ci-calendar', 'ci_calendar_shortcode');