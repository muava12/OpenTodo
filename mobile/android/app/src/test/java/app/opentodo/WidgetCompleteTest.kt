package app.opentodo

import org.junit.Assert.assertEquals
import org.junit.Test

class WidgetCompleteTest {
    @Test fun aRowOpensTheCompletionPath() {
        const val id = "t-1"
        const val path = ReminderSchedule.widgetTaskPath(id)
        assertEquals("/?task=t-1&action=done", path)
    }

    @Test fun aTaskIdWithASpaceIsEncoded() {
        assertEquals("/?task=a+b&action=done", ReminderSchedule.widgetTaskPath("a b"))
    }
}
