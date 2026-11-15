package app.opentodo

import org.junit.Assert.assertEquals
import org.junit.Test

class ChannelsTest {
    @Test fun fourChannels() {
        assertEquals("reminders", Notifier.CHANNEL)
        assertEquals("daily", Notifier.CHANNEL_DAILY)
        assertEquals("pinned", Notifier.CHANNEL_PINNED)
        assertEquals("capture", Notifier.CHANNEL_CAPTURE)
    }
}