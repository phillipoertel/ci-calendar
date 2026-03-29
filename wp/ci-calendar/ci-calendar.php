<?php

/**
* Plugin Name: Google CI Calendar Integration
* Version: 1.1
* Description: Google Calendar integration
*/

function ci_calendar_shortcode() {
    $url =
  'https://calendar.google.com/calendar/ical/' .
  '7cd67ecc1e05891f0a89b08a145dca65102fb64fa16b18e4385f89895d2ac18f%40group.calendar.google.com' .
  '/public/basic.ics';

    $response = wp_remote_get($url);
    $ical = wp_remote_retrieve_body($response);

    wp_enqueue_script('my-calendar', plugin_dir_url(__FILE__) . 'calendar.js', [], '1.0', true);
    wp_enqueue_style('my-calendar', plugin_dir_url(__FILE__) . 'calendar.css');
    
    wp_localize_script('my-calendar', 'CalendarData', ['ical' => $ical]);
    
    ob_start(); ?>
    <link rel="stylesheet" href="<?php echo esc_url(plugin_dir_url(__FILE__) . 'ci-calendar.css'); ?>">
    <?php echo file_get_contents(plugin_dir_path(__FILE__) . 'ci-calendar.html'); ?>
    <script src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'ci-calendar.js'); ?>"></script>
    <script>
        initCalendar(<?php echo json_encode($ical); ?>);
    </script>
    <?php return ob_get_clean();
}

add_shortcode('ci-calendar', 'ci_calendar_shortcode');