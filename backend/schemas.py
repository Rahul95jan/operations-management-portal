from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    role: str


class SessionCreate(BaseModel):
    topic: str
    mentor_name: str
    batch_name: str
    session_date: str
    session_time: str
    status: str


class MentorCreate(BaseModel):
    name: str
    email: str
    phone: str
    expertise: str
    linkedin: str
    hourly_rate: str


class BatchCreate(BaseModel):
    batch_name: str
    course_name: str
    strength: int
    mentor_name: str


class InvoiceCreate(BaseModel):
    mentor_name: str
    mentor_email: str | None = None
    batch_name: str
    month: str
    total_sessions: int
    total_hours: str
    hourly_rate: str
    total_amount: str
    payment_status: str
    invoice_number: str | None = None


class SessionAnalyticsCreate(BaseModel):
    session_id: int
    mentor_name: str
    batch_name: str
    scheduled_duration: float
    actual_duration: float
    mentor_join_time: str
    mentor_leave_time: str
    first_student_join: str
    last_student_leave: str
    registered_count: int
    joined_count: int
    unique_attendance: int
    duplicate_joins: int
    attendance_percentage: float
    late_joiners: int
    early_leavers: int
    poll_count: int
    poll_participants: int
    quiz_count: int
    quiz_participants: int
    average_quiz_score: float
    chat_messages: int
    private_messages: int
    public_messages: int
    questions_asked: int
    questions_answered: int
    recording_available: str
    recording_duration: float


class NPSCreate(BaseModel):
    learner_name: str
    learner_email: str
    mobile_number: str

    course_name: str
    batch_name: str
    mentor_name: str

    instructor_rating: int
    doubt_rating: int
    website_rating: int

    nps_score: int

    feedback: str