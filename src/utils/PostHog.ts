import posthog from 'posthog-js'

function Load() {
    posthog.init('phc_eHG65ArGON6CfDtepgtXeE2bXNU1CPmiUYlNpxSUYBd',
        {
            api_host: 'https://eu.i.posthog.com',
            person_profiles: 'always'
        }
    );
}

function OnNavigate(location) {
    // Turned Off for some while
    /* posthog.capture(`User:Navigated`)
    posthog.capture(`Navigation:${location.pathname}`, {
        navigation_data: location
    }) */
}

const PostHog = {
    Load,
    OnNavigate
}

export default PostHog;