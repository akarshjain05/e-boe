--
-- PostgreSQL database dump
--

\restrict VRPtnMmrEjf0CO67Tc8Re0s7FOUQo9MH22tMAyQnQ8gaDzkJe0dzt1oEUaMnepr

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adjustments; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.adjustments (
    bill_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    adjustment_type character varying(50) NOT NULL,
    reason text NOT NULL,
    adjusted_by uuid NOT NULL,
    approved_by uuid,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.adjustments OWNER TO eboe;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO eboe;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.announcements (
    company_id uuid,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    priority character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    published_at timestamp with time zone,
    expires_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.announcements OWNER TO eboe;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.api_keys (
    company_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    key_prefix character varying(8) NOT NULL,
    key_hash character varying(255) NOT NULL,
    permissions jsonb,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.api_keys OWNER TO eboe;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    company_id uuid,
    user_id uuid,
    action character varying(50) NOT NULL,
    resource_type character varying(100) NOT NULL,
    resource_id uuid,
    description text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(50),
    user_agent character varying(255),
    request_method character varying(10),
    request_url character varying(1000),
    metadata_json jsonb,
    "timestamp" timestamp with time zone NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO eboe;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: eboe
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO eboe;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eboe
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: bill_approvals; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bill_approvals (
    bill_id uuid NOT NULL,
    approver_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    comments text,
    approved_at timestamp with time zone,
    level integer NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.bill_approvals OWNER TO eboe;

--
-- Name: bill_attachments; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bill_attachments (
    bill_id uuid NOT NULL,
    document_id uuid NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.bill_attachments OWNER TO eboe;

--
-- Name: bill_comments; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bill_comments (
    bill_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    mentioned_user_ids jsonb,
    is_internal boolean NOT NULL,
    parent_comment_id uuid,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.bill_comments OWNER TO eboe;

--
-- Name: bill_items; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bill_items (
    bill_id uuid NOT NULL,
    description character varying(500) NOT NULL,
    hsn_code character varying(50),
    quantity numeric(15,2) NOT NULL,
    unit character varying(50),
    unit_price numeric(15,2) NOT NULL,
    discount_percent numeric(5,2) NOT NULL,
    tax_rate numeric(5,2) NOT NULL,
    tax_amount numeric(15,2) NOT NULL,
    amount numeric(15,2) NOT NULL,
    sort_order integer NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL,
    cgst_amount numeric(15,2) DEFAULT 0.0 NOT NULL,
    sgst_amount numeric(15,2) DEFAULT 0.0 NOT NULL,
    igst_amount numeric(15,2) DEFAULT 0.0 NOT NULL
);


ALTER TABLE public.bill_items OWNER TO eboe;

--
-- Name: bill_reminders; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bill_reminders (
    bill_id uuid NOT NULL,
    reminder_type character varying(50) NOT NULL,
    reminder_date date NOT NULL,
    message text NOT NULL,
    sent_at timestamp with time zone,
    status character varying(50) NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.bill_reminders OWNER TO eboe;

--
-- Name: bill_status_history; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bill_status_history (
    bill_id uuid NOT NULL,
    from_status character varying(50) NOT NULL,
    to_status character varying(50) NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone NOT NULL,
    comments text,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.bill_status_history OWNER TO eboe;

--
-- Name: bill_terms; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bill_terms (
    bill_id uuid NOT NULL,
    term_text text NOT NULL,
    sort_order integer NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.bill_terms OWNER TO eboe;

--
-- Name: bill_versions; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bill_versions (
    bill_id uuid NOT NULL,
    version_number integer NOT NULL,
    data_snapshot jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone NOT NULL,
    change_summary text,
    id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.bill_versions OWNER TO eboe;

--
-- Name: bills; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bills (
    company_id uuid NOT NULL,
    branch_id uuid,
    bill_number character varying(50) NOT NULL,
    bill_type character varying(50) NOT NULL,
    customer_id uuid,
    creditor_id uuid,
    drawer_name character varying(255) NOT NULL,
    drawer_address text,
    drawer_account character varying(100),
    drawee_name character varying(255) NOT NULL,
    drawee_address text,
    drawee_account character varying(100),
    payee_name character varying(255) NOT NULL,
    payee_address text,
    payee_account character varying(100),
    amount numeric(15,2) NOT NULL,
    currency_code character varying(3) NOT NULL,
    exchange_rate numeric(10,4) NOT NULL,
    amount_in_words character varying(500),
    interest_rate numeric(5,2) NOT NULL,
    penalty_rate numeric(5,2) NOT NULL,
    discount_amount numeric(15,2) NOT NULL,
    tax_amount numeric(15,2) NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    paid_amount numeric(15,2) NOT NULL,
    outstanding_amount numeric(15,2) NOT NULL,
    status character varying(50) NOT NULL,
    issue_date date NOT NULL,
    due_date date NOT NULL,
    accepted_at timestamp with time zone,
    sent_at timestamp with time zone,
    viewed_at timestamp with time zone,
    paid_at timestamp with time zone,
    closed_at timestamp with time zone,
    place_of_issue character varying(255),
    place_of_payment character varying(255),
    terms_and_conditions text,
    internal_notes text,
    qr_code_url character varying(255),
    barcode_url character varying(255),
    pdf_url character varying(255),
    digital_signature_data text,
    is_recurring boolean NOT NULL,
    recurrence_pattern character varying(100),
    parent_bill_id uuid,
    version_number integer NOT NULL,
    approval_chain_id uuid,
    priority character varying(50) NOT NULL,
    tags jsonb,
    custom_fields jsonb,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL,
    drawer_state character varying(100),
    drawee_state character varying(100),
    credit_period_months numeric(5,2),
    transaction_type character varying(50) DEFAULT 'intra_state'::character varying NOT NULL,
    network_drawee_company_id uuid,
    network_payee_company_id uuid,
    drawee_creditor_id uuid,
    payee_customer_id uuid
);


ALTER TABLE public.bills OWNER TO eboe;

--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.bookmarks (
    user_id uuid NOT NULL,
    resource_type character varying(100) NOT NULL,
    resource_id uuid NOT NULL,
    label character varying(100),
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.bookmarks OWNER TO eboe;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.branches (
    company_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    email character varying(255),
    phone character varying(50),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    country character varying(100),
    postal_code character varying(20),
    is_active boolean NOT NULL,
    is_head_office boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.branches OWNER TO eboe;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.companies (
    name character varying(100) NOT NULL,
    legal_name character varying(255),
    registration_number character varying(50),
    organization_type character varying(50),
    pan_number character varying(50),
    tax_id character varying(50),
    gst_number character varying(50),
    logo_url character varying(255),
    website character varying(255),
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    country character varying(100),
    postal_code character varying(20),
    currency_code character varying(3) NOT NULL,
    timezone character varying(50) NOT NULL,
    settings_json jsonb,
    is_active boolean NOT NULL,
    subscription_plan character varying(50),
    subscription_expires_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.companies OWNER TO eboe;

--
-- Name: creditor_addresses; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.creditor_addresses (
    creditor_id uuid NOT NULL,
    address_type character varying(50) NOT NULL,
    line1 character varying(255) NOT NULL,
    line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    is_default boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.creditor_addresses OWNER TO eboe;

--
-- Name: creditor_bank_details; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.creditor_bank_details (
    creditor_id uuid NOT NULL,
    bank_name character varying(255) NOT NULL,
    branch_name character varying(255),
    account_number character varying(100) NOT NULL,
    account_type character varying(50) NOT NULL,
    ifsc_code character varying(50),
    swift_code character varying(50),
    iban character varying(50),
    is_primary boolean NOT NULL,
    is_verified boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.creditor_bank_details OWNER TO eboe;

--
-- Name: creditor_blacklist; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.creditor_blacklist (
    creditor_id uuid NOT NULL,
    reason text NOT NULL,
    blacklisted_by uuid NOT NULL,
    blacklisted_at timestamp with time zone NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.creditor_blacklist OWNER TO eboe;

--
-- Name: creditor_contacts; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.creditor_contacts (
    creditor_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    designation character varying(100),
    email character varying(255),
    phone character varying(50),
    is_primary boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.creditor_contacts OWNER TO eboe;

--
-- Name: creditor_notes; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.creditor_notes (
    creditor_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_pinned boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.creditor_notes OWNER TO eboe;

--
-- Name: creditor_tags; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.creditor_tags (
    creditor_id uuid NOT NULL,
    tag character varying(50) NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.creditor_tags OWNER TO eboe;

--
-- Name: creditors; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.creditors (
    company_id uuid NOT NULL,
    branch_id uuid,
    creditor_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    legal_name character varying(255),
    business_type character varying(50) NOT NULL,
    creditor_type character varying(50) NOT NULL,
    gst_number character varying(50),
    pan_number character varying(50),
    tan_number character varying(50),
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    website character varying(255),
    credit_limit numeric(15,2),
    outstanding_balance numeric(15,2) NOT NULL,
    payment_terms_days integer NOT NULL,
    status character varying(50) NOT NULL,
    risk_rating character varying(50) NOT NULL,
    notes text,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.creditors OWNER TO eboe;

--
-- Name: currencies; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.currencies (
    code character varying(3) NOT NULL,
    name character varying(100) NOT NULL,
    symbol character varying(10) NOT NULL,
    exchange_rate numeric(10,4) NOT NULL,
    is_base boolean NOT NULL,
    is_active boolean NOT NULL,
    decimal_places integer NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.currencies OWNER TO eboe;

--
-- Name: custom_field_values; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.custom_field_values (
    custom_field_id uuid NOT NULL,
    resource_id uuid NOT NULL,
    value text NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.custom_field_values OWNER TO eboe;

--
-- Name: custom_fields; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.custom_fields (
    company_id uuid NOT NULL,
    resource_type character varying(100) NOT NULL,
    field_name character varying(100) NOT NULL,
    field_label character varying(100) NOT NULL,
    field_type character varying(50) NOT NULL,
    options jsonb,
    is_required boolean NOT NULL,
    sort_order integer NOT NULL,
    is_active boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.custom_fields OWNER TO eboe;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.customer_addresses (
    customer_id uuid NOT NULL,
    address_type character varying(50) NOT NULL,
    line1 character varying(255) NOT NULL,
    line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    is_default boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customer_addresses OWNER TO eboe;

--
-- Name: customer_bank_details; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.customer_bank_details (
    customer_id uuid NOT NULL,
    bank_name character varying(255) NOT NULL,
    branch_name character varying(255),
    account_number character varying(100) NOT NULL,
    account_type character varying(50) NOT NULL,
    ifsc_code character varying(50),
    swift_code character varying(50),
    iban character varying(50),
    is_primary boolean NOT NULL,
    is_verified boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customer_bank_details OWNER TO eboe;

--
-- Name: customer_blacklist; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.customer_blacklist (
    customer_id uuid NOT NULL,
    reason text NOT NULL,
    blacklisted_by uuid NOT NULL,
    blacklisted_at timestamp with time zone NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customer_blacklist OWNER TO eboe;

--
-- Name: customer_contacts; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.customer_contacts (
    customer_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    designation character varying(100),
    email character varying(255),
    phone character varying(50),
    is_primary boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customer_contacts OWNER TO eboe;

--
-- Name: customer_notes; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.customer_notes (
    customer_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_pinned boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customer_notes OWNER TO eboe;

--
-- Name: customer_tags; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.customer_tags (
    customer_id uuid NOT NULL,
    tag character varying(50) NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customer_tags OWNER TO eboe;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.customers (
    company_id uuid NOT NULL,
    branch_id uuid,
    customer_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    legal_name character varying(255),
    business_type character varying(50) NOT NULL,
    customer_type character varying(50) NOT NULL,
    gst_number character varying(50),
    pan_number character varying(50),
    tan_number character varying(50),
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    website character varying(255),
    credit_limit numeric(15,2),
    outstanding_balance numeric(15,2) NOT NULL,
    payment_terms_days integer NOT NULL,
    status character varying(50) NOT NULL,
    risk_rating character varying(50) NOT NULL,
    notes text,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.customers OWNER TO eboe;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.documents (
    company_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    size bigint NOT NULL,
    path character varying(1000) NOT NULL,
    storage_type character varying(50) NOT NULL,
    category character varying(50) NOT NULL,
    uploaded_by uuid NOT NULL,
    is_public boolean NOT NULL,
    metadata_json jsonb,
    checksum character varying(255),
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.documents OWNER TO eboe;

--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.email_templates (
    company_id uuid,
    name character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    body_html text NOT NULL,
    body_text text,
    variables jsonb,
    category character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.email_templates OWNER TO eboe;

--
-- Name: holidays; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.holidays (
    company_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    date date NOT NULL,
    is_recurring boolean NOT NULL,
    holiday_type character varying(50) NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.holidays OWNER TO eboe;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.notifications (
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean NOT NULL,
    read_at timestamp with time zone,
    data_json jsonb,
    priority character varying(50) NOT NULL,
    expires_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.notifications OWNER TO eboe;

--
-- Name: payment_proofs; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.payment_proofs (
    payment_id uuid NOT NULL,
    document_id uuid NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.payment_proofs OWNER TO eboe;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.payments (
    company_id uuid NOT NULL,
    bill_id uuid NOT NULL,
    receipt_number character varying(50) NOT NULL,
    transaction_number character varying(100),
    reference_number character varying(100),
    amount numeric(15,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_date date NOT NULL,
    bank_name character varying(100),
    cheque_number character varying(50),
    cheque_date date,
    upi_id character varying(100),
    transaction_id character varying(100),
    status character varying(50) NOT NULL,
    notes text,
    received_by uuid,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.payments OWNER TO eboe;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.permissions (
    name character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.permissions OWNER TO eboe;

--
-- Name: recycle_bin; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.recycle_bin (
    company_id uuid NOT NULL,
    resource_type character varying(100) NOT NULL,
    resource_id uuid NOT NULL,
    resource_data jsonb NOT NULL,
    deleted_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.recycle_bin OWNER TO eboe;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.refunds (
    payment_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    reason text NOT NULL,
    status character varying(50) NOT NULL,
    refund_method character varying(50),
    refund_reference character varying(100),
    refunded_by uuid,
    approved_by uuid,
    processed_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.refunds OWNER TO eboe;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO eboe;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.roles (
    name character varying(50) NOT NULL,
    description text,
    is_system_role boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.roles OWNER TO eboe;

--
-- Name: scheduled_reports; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.scheduled_reports (
    company_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    report_type character varying(50) NOT NULL,
    schedule_cron character varying(100) NOT NULL,
    recipients jsonb NOT NULL,
    config jsonb,
    is_active boolean NOT NULL,
    last_run_at timestamp with time zone,
    next_run_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.scheduled_reports OWNER TO eboe;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.settings (
    company_id uuid,
    category character varying(100) NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    value_type character varying(50) NOT NULL,
    description text,
    is_encrypted boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.settings OWNER TO eboe;

--
-- Name: tax_configs; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.tax_configs (
    company_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    rate numeric(5,2) NOT NULL,
    tax_type character varying(50) NOT NULL,
    is_default boolean NOT NULL,
    is_active boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.tax_configs OWNER TO eboe;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.user_sessions (
    user_id uuid NOT NULL,
    refresh_token_hash character varying(255) NOT NULL,
    ip_address character varying(50),
    user_agent character varying(255),
    device_info text,
    is_active boolean NOT NULL,
    last_active_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO eboe;

--
-- Name: users; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.users (
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    pan_number character varying(50),
    avatar_url character varying(255),
    role_id uuid,
    company_id uuid,
    branch_id uuid,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    is_superuser boolean NOT NULL,
    mfa_enabled boolean NOT NULL,
    mfa_secret character varying(255),
    last_login_at timestamp with time zone,
    email_verified_at timestamp with time zone,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.users OWNER TO eboe;

--
-- Name: webhook_logs; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.webhook_logs (
    webhook_id uuid NOT NULL,
    event character varying(100) NOT NULL,
    payload jsonb,
    response_status integer,
    response_body text,
    is_success boolean NOT NULL,
    delivered_at timestamp with time zone NOT NULL,
    duration_ms integer,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.webhook_logs OWNER TO eboe;

--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: eboe
--

CREATE TABLE public.webhooks (
    company_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    url character varying(1000) NOT NULL,
    secret_hash character varying(255),
    events jsonb,
    is_active boolean NOT NULL,
    last_triggered_at timestamp with time zone,
    failure_count integer NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean NOT NULL
);


ALTER TABLE public.webhooks OWNER TO eboe;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Data for Name: adjustments; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.adjustments (bill_id, amount, adjustment_type, reason, adjusted_by, approved_by, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.alembic_version (version_num) FROM stdin;
c201e8df15c9
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.announcements (company_id, title, content, priority, is_active, published_at, expires_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.api_keys (company_id, name, key_prefix, key_hash, permissions, last_used_at, expires_at, is_active, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.audit_logs (id, company_id, user_id, action, resource_type, resource_id, description, old_values, new_values, ip_address, user_agent, request_method, request_url, metadata_json, "timestamp") FROM stdin;
\.


--
-- Data for Name: bill_approvals; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bill_approvals (bill_id, approver_id, status, comments, approved_at, level, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: bill_attachments; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bill_attachments (bill_id, document_id, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: bill_comments; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bill_comments (bill_id, user_id, content, mentioned_user_ids, is_internal, parent_comment_id, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: bill_items; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bill_items (bill_id, description, hsn_code, quantity, unit, unit_price, discount_percent, tax_rate, tax_amount, amount, sort_order, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted, cgst_amount, sgst_amount, igst_amount) FROM stdin;
351afb69-8f5a-4a13-a258-59ba7e476466	car	\N	1.00	\N	1000.00	0.00	18.00	180.00	1180.00	0	69d7f53d-cba2-412a-a1a9-5aab760bc336	2026-07-10 11:49:31.49141+00	2026-07-10 11:49:31.49141+00	\N	\N	\N	f	90.00	90.00	0.00
b36fb539-d57a-4ba4-b76c-066ca967fb1e	car	\N	1.00	\N	1000.00	0.00	18.00	180.00	1180.00	0	41133485-2c93-4d7a-9cc7-37fec062c0c4	2026-07-10 12:08:47.141396+00	2026-07-10 12:08:47.141396+00	\N	\N	\N	f	90.00	90.00	0.00
2f9e12bf-6d24-4728-832b-787d32460db8	car	\N	1.00	\N	9999.97	0.00	18.00	1799.99	11799.96	0	f9801bdf-6623-4a9e-9bd4-d18146d1a299	2026-07-10 12:23:43.251464+00	2026-07-10 12:23:43.251464+00	\N	\N	\N	f	900.00	900.00	0.00
f9d80d34-d764-47e8-b8e1-c18aa741e76b	car	\N	1.00	\N	4563.97	0.00	18.00	821.51	5385.48	0	140aca8c-aca4-47ba-afa4-05f391c65c79	2026-07-10 12:26:27.207564+00	2026-07-10 12:26:27.207564+00	\N	\N	\N	f	410.76	410.76	0.00
0933124f-5d50-457d-a02e-d145116e3a93	car	\N	1.00	\N	76849.00	0.00	18.00	13832.82	90681.82	0	2d950363-a744-40a5-9dd5-0c823f28883e	2026-07-10 12:29:41.684649+00	2026-07-10 12:29:41.684649+00	\N	\N	\N	f	6916.41	6916.41	0.00
1f2505e5-90dc-461a-94ba-e0de825f5389	fdg	\N	1.00	\N	456678.00	0.00	18.00	82202.04	538880.04	0	2b303d64-65ca-41f9-a28d-be7a19e2c597	2026-07-10 12:41:36.80483+00	2026-07-10 12:41:36.80483+00	\N	\N	\N	f	41101.02	41101.02	0.00
fbce0f23-68d4-44c7-867d-9133b648cbf0	fgvhg	\N	1.00	\N	847123.00	0.00	18.00	152482.14	999605.14	0	aa2da654-4c63-448a-87f5-258adf4d336b	2026-07-10 12:56:42.516496+00	2026-07-10 12:56:42.516496+00	\N	\N	\N	f	76241.07	76241.07	0.00
\.


--
-- Data for Name: bill_reminders; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bill_reminders (bill_id, reminder_type, reminder_date, message, sent_at, status, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: bill_status_history; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bill_status_history (bill_id, from_status, to_status, changed_by, changed_at, comments, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: bill_terms; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bill_terms (bill_id, term_text, sort_order, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: bill_versions; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bill_versions (bill_id, version_number, data_snapshot, created_by, created_at, change_summary, id, updated_at, deleted_at, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bills (company_id, branch_id, bill_number, bill_type, customer_id, creditor_id, drawer_name, drawer_address, drawer_account, drawee_name, drawee_address, drawee_account, payee_name, payee_address, payee_account, amount, currency_code, exchange_rate, amount_in_words, interest_rate, penalty_rate, discount_amount, tax_amount, total_amount, paid_amount, outstanding_amount, status, issue_date, due_date, accepted_at, sent_at, viewed_at, paid_at, closed_at, place_of_issue, place_of_payment, terms_and_conditions, internal_notes, qr_code_url, barcode_url, pdf_url, digital_signature_data, is_recurring, recurrence_pattern, parent_bill_id, version_number, approval_chain_id, priority, tags, custom_fields, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted, drawer_state, drawee_state, credit_period_months, transaction_type, network_drawee_company_id, network_payee_company_id, drawee_creditor_id, payee_customer_id) FROM stdin;
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	BOE-1783684150	receivable	c2393ecd-c7d3-4a3a-84f8-db35679919c5	\N	Akarsh Jain	\N	\N	Tata2	\N	\N	Akarsh Jain	\N	\N	1000.00	INR	1.0000	\N	0.00	0.00	0.00	180.00	1180.00	0.00	1180.00	draft	2026-07-10	2026-09-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1	\N	normal	null	\N	351afb69-8f5a-4a13-a258-59ba7e476466	2026-07-10 11:49:31.49141+00	2026-07-10 12:08:32.578552+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	t	\N	\N	2.00	intra_state	\N	\N	\N	\N
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	BOE-1783685313	receivable	c2393ecd-c7d3-4a3a-84f8-db35679919c5	\N	Akarsh Jain	\N	\N	Tata2	\N	\N	Akarsh Jain	\N	\N	1000.00	INR	1.0000	\N	0.00	0.00	0.00	180.00	1180.00	0.00	1180.00	accepted	2026-07-10	2026-09-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1	\N	normal	null	\N	b36fb539-d57a-4ba4-b76c-066ca967fb1e	2026-07-10 12:08:47.141396+00	2026-07-10 12:20:59.900178+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	b4ad19ff-9e1d-4059-b629-3a0b53c05741	f	\N	\N	2.00	intra_state	427cb383-7ab0-473b-bf98-898e861b3b63	\N	60a6abd8-1adf-4f62-9841-412494a4c2e2	\N
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	BOE-1783686196	receivable	c2393ecd-c7d3-4a3a-84f8-db35679919c5	\N	Akarsh Jain	\N	\N	Tata2	\N	\N	Akarsh Jain	\N	\N	9999.97	INR	1.0000	\N	0.00	0.00	0.00	1799.99	11799.96	0.00	11799.96	accepted	2026-07-10	2026-12-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1	\N	normal	null	\N	2f9e12bf-6d24-4728-832b-787d32460db8	2026-07-10 12:23:43.251464+00	2026-07-10 12:24:27.643858+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	b4ad19ff-9e1d-4059-b629-3a0b53c05741	f	\N	\N	5.00	intra_state	427cb383-7ab0-473b-bf98-898e861b3b63	\N	60a6abd8-1adf-4f62-9841-412494a4c2e2	\N
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	BOE-1783686548	receivable	c2393ecd-c7d3-4a3a-84f8-db35679919c5	\N	Akarsh Jain	\N	\N	Tata2	\N	\N	Akarsh Jain	\N	\N	76849.00	INR	1.0000	\N	0.00	0.00	0.00	13832.82	90681.82	0.00	90681.82	draft	2026-07-10	2031-03-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1	\N	normal	null	\N	0933124f-5d50-457d-a02e-d145116e3a93	2026-07-10 12:29:41.684649+00	2026-07-10 12:40:02.30721+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	t	\N	\N	56.00	intra_state	427cb383-7ab0-473b-bf98-898e861b3b63	\N	60a6abd8-1adf-4f62-9841-412494a4c2e2	\N
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	BOE-1783686332	receivable	c2393ecd-c7d3-4a3a-84f8-db35679919c5	\N	Akarsh Jain	\N	\N	Tata2	\N	\N	Akarsh Jain	\N	\N	4563.97	INR	1.0000	\N	0.00	0.00	0.00	821.51	5385.48	5385.48	0.00	paid	2026-07-10	2027-05-10	\N	\N	\N	2026-07-10 12:40:33.332712+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1	\N	normal	null	\N	f9d80d34-d764-47e8-b8e1-c18aa741e76b	2026-07-10 12:26:27.207564+00	2026-07-10 12:40:33.325617+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	f	\N	\N	10.00	intra_state	427cb383-7ab0-473b-bf98-898e861b3b63	\N	60a6abd8-1adf-4f62-9841-412494a4c2e2	\N
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	BOE-1783687282	receivable	c2393ecd-c7d3-4a3a-84f8-db35679919c5	\N	Akarsh Jain	\N	\N	Tata2	\N	\N	Akarsh Jain	\N	\N	456678.00	INR	1.0000	\N	0.00	0.00	0.00	82202.04	538880.04	538880.04	0.00	paid	2026-07-10	2027-04-10	\N	\N	\N	2026-07-10 12:59:55.827539+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1	\N	normal	null	\N	1f2505e5-90dc-461a-94ba-e0de825f5389	2026-07-10 12:41:36.80483+00	2026-07-10 12:59:55.822748+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	f	\N	\N	9.00	intra_state	427cb383-7ab0-473b-bf98-898e861b3b63	\N	60a6abd8-1adf-4f62-9841-412494a4c2e2	\N
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	BOE-1783688188	receivable	c2393ecd-c7d3-4a3a-84f8-db35679919c5	\N	Akarsh Jain	\N	\N	Tata2	\N	\N	Akarsh Jain	\N	\N	847123.00	INR	1.0000	\N	0.00	0.00	0.00	152482.14	999605.14	999605.14	0.00	paid	2026-07-10	2026-10-10	\N	\N	\N	2026-07-10 13:00:20.226183+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	1	\N	normal	null	\N	fbce0f23-68d4-44c7-867d-9133b648cbf0	2026-07-10 12:56:42.516496+00	2026-07-10 13:00:20.217154+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	f	\N	\N	3.00	intra_state	427cb383-7ab0-473b-bf98-898e861b3b63	\N	60a6abd8-1adf-4f62-9841-412494a4c2e2	\N
\.


--
-- Data for Name: bookmarks; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.bookmarks (user_id, resource_type, resource_id, label, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.branches (company_id, name, code, email, phone, address_line1, address_line2, city, state, country, postal_code, is_active, is_head_office, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.companies (name, legal_name, registration_number, organization_type, pan_number, tax_id, gst_number, logo_url, website, email, phone, address_line1, address_line2, city, state, country, postal_code, currency_code, timezone, settings_json, is_active, subscription_plan, subscription_expires_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
Tata1	\N	\N	Partnership	ABCDE1234F	\N	101	\N		akarshjain2006@gmail.com	7321019524		\N					INR	Asia/Kolkata	\N	t	\N	\N	d81de153-7c8b-439d-8609-9b34aacdc18a	2026-07-10 11:22:15.024723+00	2026-07-10 11:22:15.024723+00	\N	\N	\N	f
Tata2	\N	\N	Private Limited	ASDFY7890O	\N	102	\N		akarshjain200@gmail.com	5647890		\N					INR	Asia/Kolkata	\N	t	\N	\N	427cb383-7ab0-473b-bf98-898e861b3b63	2026-07-10 11:34:38.058734+00	2026-07-10 11:34:38.058734+00	\N	\N	\N	f
\.


--
-- Data for Name: creditor_addresses; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.creditor_addresses (creditor_id, address_type, line1, line2, city, state, country, postal_code, is_default, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: creditor_bank_details; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.creditor_bank_details (creditor_id, bank_name, branch_name, account_number, account_type, ifsc_code, swift_code, iban, is_primary, is_verified, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: creditor_blacklist; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.creditor_blacklist (creditor_id, reason, blacklisted_by, blacklisted_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: creditor_contacts; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.creditor_contacts (creditor_id, name, designation, email, phone, is_primary, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: creditor_notes; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.creditor_notes (creditor_id, user_id, content, is_pinned, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: creditor_tags; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.creditor_tags (creditor_id, tag, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: creditors; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.creditors (company_id, branch_id, creditor_code, name, legal_name, business_type, creditor_type, gst_number, pan_number, tan_number, email, phone, website, credit_limit, outstanding_balance, payment_terms_days, status, risk_rating, notes, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
427cb383-7ab0-473b-bf98-898e861b3b63	\N	CR-CD1C93C4	Tata1	\N	Corporate	Trade	101	ABCDE1234F	\N	akarshjain2006@gmail.com	7321019524	\N	\N	0.00	30	active	low	\N	60a6abd8-1adf-4f62-9841-412494a4c2e2	2026-07-10 12:08:47.141396+00	2026-07-10 12:08:47.141396+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	f
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.currencies (code, name, symbol, exchange_rate, is_base, is_active, decimal_places, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: custom_field_values; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.custom_field_values (custom_field_id, resource_id, value, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: custom_fields; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.custom_fields (company_id, resource_type, field_name, field_label, field_type, options, is_required, sort_order, is_active, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.customer_addresses (customer_id, address_type, line1, line2, city, state, country, postal_code, is_default, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: customer_bank_details; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.customer_bank_details (customer_id, bank_name, branch_name, account_number, account_type, ifsc_code, swift_code, iban, is_primary, is_verified, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: customer_blacklist; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.customer_blacklist (customer_id, reason, blacklisted_by, blacklisted_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: customer_contacts; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.customer_contacts (customer_id, name, designation, email, phone, is_primary, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: customer_notes; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.customer_notes (customer_id, user_id, content, is_pinned, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: customer_tags; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.customer_tags (customer_id, tag, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.customers (company_id, branch_id, customer_code, name, legal_name, business_type, customer_type, gst_number, pan_number, tan_number, email, phone, website, credit_limit, outstanding_balance, payment_terms_days, status, risk_rating, notes, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	CUST-1783683203960	Tata1	\N	B2B	B2B	101	\N	\N	akarshjain2006@gmail.com	7321019524	\N	0.00	0.00	30	active	low	\N	85affc1c-2f38-43ab-9384-3fedcf99011a	2026-07-10 11:33:23.98727+00	2026-07-10 11:39:55.322147+00	2026-07-10 11:39:55.322147+00	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	t
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	CUST-1783683586348	Tata1	\N	B2B	B2B	101	\N	\N	akarshjain2006@gmail.com	7321019524	\N	0.00	0.00	30	active	low	\N	f868a55f-2392-478d-b509-cd9ec3c2075e	2026-07-10 11:39:46.375762+00	2026-07-10 11:40:28.594282+00	2026-07-10 11:40:28.594282+00	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	t
427cb383-7ab0-473b-bf98-898e861b3b63	\N	CUST-1783683317883	Tata2	\N	B2B	B2B	102	\N	\N	akarshjain200@gmail.com	5647890	\N	0.00	0.00	30	active	low	\N	a10cb866-123c-4e1c-bfd2-b5004b478634	2026-07-10 11:35:17.911184+00	2026-07-10 11:48:58.094259+00	2026-07-10 11:48:58.094259+00	b4ad19ff-9e1d-4059-b629-3a0b53c05741	b4ad19ff-9e1d-4059-b629-3a0b53c05741	t
427cb383-7ab0-473b-bf98-898e861b3b63	\N	CUST-1783684143714	Tata1	\N	B2B	B2B	101	\N	\N	akarshjain2006@gmail.com	7321019524	\N	0.00	0.00	30	active	low	\N	1e30ed5d-ca31-4f0d-b3e3-047483da352b	2026-07-10 11:49:03.73581+00	2026-07-10 11:49:03.73581+00	\N	b4ad19ff-9e1d-4059-b629-3a0b53c05741	b4ad19ff-9e1d-4059-b629-3a0b53c05741	f
d81de153-7c8b-439d-8609-9b34aacdc18a	\N	CUST-1783684146700	Tata2	\N	B2B	B2B	102	\N	\N	akarshjain200@gmail.com	5647890	\N	0.00	0.00	30	active	low	\N	c2393ecd-c7d3-4a3a-84f8-db35679919c5	2026-07-10 11:49:06.732716+00	2026-07-10 11:49:06.732716+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	f
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.documents (company_id, name, original_name, mime_type, size, path, storage_type, category, uploaded_by, is_public, metadata_json, checksum, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.email_templates (company_id, name, subject, body_html, body_text, variables, category, is_active, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: holidays; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.holidays (company_id, name, date, is_recurring, holiday_type, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.notifications (company_id, user_id, type, title, message, is_read, read_at, data_json, priority, expires_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: payment_proofs; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.payment_proofs (payment_id, document_id, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.payments (company_id, bill_id, receipt_number, transaction_number, reference_number, amount, payment_method, payment_date, bank_name, cheque_number, cheque_date, upi_id, transaction_id, status, notes, received_by, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
d81de153-7c8b-439d-8609-9b34aacdc18a	f9d80d34-d764-47e8-b8e1-c18aa741e76b	RCP-20260710-E1C134	\N	\N	5385.48	bank_transfer	2026-07-10	\N	\N	\N	\N	\N	confirmed	Bulk payment to Tata2	7197cb0e-272d-44c8-a882-729ce69de1dc	e2142149-1129-4b48-a038-72b7d0fd5473	2026-07-10 12:40:33.325617+00	2026-07-10 12:40:33.325617+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	f
d81de153-7c8b-439d-8609-9b34aacdc18a	1f2505e5-90dc-461a-94ba-e0de825f5389	RCP-20260710-0850CF	\N	\N	538880.04	bank_transfer	2026-07-10	\N	\N	\N	\N	\N	confirmed	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	693b1723-fdcf-4b9c-b7f0-c8754e98e117	2026-07-10 12:59:55.822748+00	2026-07-10 12:59:55.822748+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	f
d81de153-7c8b-439d-8609-9b34aacdc18a	fbce0f23-68d4-44c7-867d-9133b648cbf0	RCP-20260710-4EE523	\N	\N	999605.14	bank_transfer	2026-07-10	\N	\N	\N	\N	\N	confirmed	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	aa61e706-d97c-4e32-926f-27566e65ad0c	2026-07-10 13:00:20.217154+00	2026-07-10 13:00:20.217154+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	7197cb0e-272d-44c8-a882-729ce69de1dc	f
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.permissions (name, resource, action, description, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: recycle_bin; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.recycle_bin (company_id, resource_type, resource_id, resource_data, deleted_at, expires_at, id, created_at, updated_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.refunds (payment_id, amount, reason, status, refund_method, refund_reference, refunded_by, approved_by, processed_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.roles (name, description, is_system_role, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: scheduled_reports; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.scheduled_reports (company_id, name, report_type, schedule_cron, recipients, config, is_active, last_run_at, next_run_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.settings (company_id, category, key, value, value_type, description, is_encrypted, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: tax_configs; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.tax_configs (company_id, name, rate, tax_type, is_default, is_active, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.user_sessions (user_id, refresh_token_hash, ip_address, user_agent, device_info, is_active, last_active_at, expires_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
7197cb0e-272d-44c8-a882-729ce69de1dc	$2b$12$wxvyNuwLNgYPH0I2.QlOFO9xuEbxkhzxGNypXLKWsr5W/mUIbtjpG	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:22:28.672541+00	2026-07-10 11:22:28.672544+00	7082723f-7469-4276-aeca-bca8c2c96b07	2026-07-10 11:22:27.954863+00	2026-07-10 11:22:27.954863+00	\N	\N	\N	f
7197cb0e-272d-44c8-a882-729ce69de1dc	$2b$12$jZ2CGh8MGZkuoNe6uAWUPurMWVFWAs2SOKiLLy8gcpM7/.suyODUu	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:25:40.788871+00	2026-07-10 11:25:40.788874+00	4dfd8cab-cfb6-4cd8-aaac-104c14a8bb35	2026-07-10 11:25:40.074099+00	2026-07-10 11:25:40.074099+00	\N	\N	\N	f
7197cb0e-272d-44c8-a882-729ce69de1dc	$2b$12$kLuLgPoOfC5KG1gKPV8ffOcGFUn6GCGDb1sof1i7QzddQzb38/O/O	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:32:56.945899+00	2026-07-10 11:32:56.945905+00	ac2f99d3-97ee-4994-ad00-55baad3bf7e3	2026-07-10 11:32:56.225127+00	2026-07-10 11:32:56.225127+00	\N	\N	\N	f
b4ad19ff-9e1d-4059-b629-3a0b53c05741	$2b$12$bd75Auugb6FUZMrneP2teu44i.PCjj8eXn3fSJnKjTelkWgtgU3ve	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:34:59.726533+00	2026-07-10 11:34:59.726544+00	b572cd36-b65f-43cb-bea6-70da961bb4e3	2026-07-10 11:34:59.01515+00	2026-07-10 11:34:59.01515+00	\N	\N	\N	f
7197cb0e-272d-44c8-a882-729ce69de1dc	$2b$12$lsrbN8XTrMQFxkLHmqs86.VPR/UrgMOSAC3bs61b4DU.cZ70O.b7O	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:39:16.159021+00	2026-07-10 11:39:16.159027+00	5c0b4ef8-0866-422e-aaf6-4b05b731221a	2026-07-10 11:39:15.448032+00	2026-07-10 11:39:15.448032+00	\N	\N	\N	f
b4ad19ff-9e1d-4059-b629-3a0b53c05741	$2b$12$sr8V424FkNqRwfhp0bnjve9YpH9s0ZStQVBP.FuvdaHUJb57ZvRbC	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:44:53.994513+00	2026-07-10 11:44:53.994518+00	5c29c5e0-8c8d-4c07-9f7a-b271252d10a5	2026-07-10 11:44:53.282924+00	2026-07-10 11:44:53.282924+00	\N	\N	\N	f
b4ad19ff-9e1d-4059-b629-3a0b53c05741	$2b$12$prJ32ZcErijenpXIa6xXF.vj.7uPBAgUMuoheEHxjtLq/freT6YyS	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:46:34.389006+00	2026-07-10 11:46:34.389032+00	a7476970-bf6b-4c49-9392-0701017806e0	2026-07-10 11:46:33.671855+00	2026-07-10 11:46:33.671855+00	\N	\N	\N	f
b4ad19ff-9e1d-4059-b629-3a0b53c05741	$2b$12$I11ehxT.C/UFz3xkyNK3ROEZ07vKLOWWyswIUwvQtdMZkHUR4dmv.	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:48:13.385125+00	2026-07-10 11:48:13.385149+00	7659c59d-1622-4fb4-9ae0-e8fe56e93dbf	2026-07-10 11:48:12.669818+00	2026-07-10 11:48:12.669818+00	\N	\N	\N	f
7197cb0e-272d-44c8-a882-729ce69de1dc	$2b$12$2Lfq7kf2659A5GnQ/eyImuhhv2JBrPOjFfsg7ArLFZHvmSqIaon4q	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 11:48:24.234481+00	2026-07-10 11:48:24.234501+00	abf72105-e925-44c2-a4d6-1412991ad52f	2026-07-10 11:48:23.523084+00	2026-07-10 11:48:23.523084+00	\N	\N	\N	f
7197cb0e-272d-44c8-a882-729ce69de1dc	$2b$12$MMSvPsV9ZVvTxT4S3bWy4.eDOdOb2Ehs0NOZpWlY/.dGAWOVb95U.	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 12:07:32.870594+00	2026-07-10 12:07:32.870599+00	7818e9a2-2d51-4504-b0c2-94075e775f2c	2026-07-10 12:07:32.151297+00	2026-07-10 12:07:32.151297+00	\N	\N	\N	f
b4ad19ff-9e1d-4059-b629-3a0b53c05741	$2b$12$Nks2MBn2FNXHRbEbL/Rz7OkWiI7k5902S3bUTaCWrkcXgNn9Yq4VG	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 12:07:51.000407+00	2026-07-10 12:07:51.00041+00	442bb673-4369-4e3e-8061-5d08539d1348	2026-07-10 12:07:50.289317+00	2026-07-10 12:07:50.289317+00	\N	\N	\N	f
b4ad19ff-9e1d-4059-b629-3a0b53c05741	$2b$12$w0I39I8itfVw2MLjATP0h.xHJ9Jc.ycw9HScrxXJsN.uMggkPSBQi	172.19.0.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	\N	t	2026-07-10 12:08:08.207857+00	2026-07-10 12:08:08.207863+00	e2b9328e-7a4f-4e56-9350-0cb02871a750	2026-07-10 12:08:07.501621+00	2026-07-10 12:08:07.501621+00	\N	\N	\N	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.users (email, password_hash, first_name, last_name, phone, pan_number, avatar_url, role_id, company_id, branch_id, is_active, is_verified, is_superuser, mfa_enabled, mfa_secret, last_login_at, email_verified_at, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
akarshjain2006@gmail.com	$2b$12$4cplAV5cSxa374VVILJTIueWF5YmCWEA27Z.DQCNDCsNs8U0TglLa	Akarsh	Jain	7321019524	ASDFG1223F	\N	\N	d81de153-7c8b-439d-8609-9b34aacdc18a	\N	t	f	t	f	\N	2026-07-10 12:07:32.510643+00	\N	7197cb0e-272d-44c8-a882-729ce69de1dc	2026-07-10 11:22:15.024723+00	2026-07-10 12:07:32.151297+00	\N	\N	\N	f
akarshjain200@gmail.com	$2b$12$L6XBCKmfTlxjOuI6A7yOK.uwxiNa8t8tJ8Awg2cFHkXIfqoLZJdJC	krish	jain	4567890	QWERT3456A	\N	\N	427cb383-7ab0-473b-bf98-898e861b3b63	\N	t	f	t	f	\N	2026-07-10 12:08:07.853649+00	\N	b4ad19ff-9e1d-4059-b629-3a0b53c05741	2026-07-10 11:34:38.058734+00	2026-07-10 12:08:07.501621+00	\N	\N	\N	f
\.


--
-- Data for Name: webhook_logs; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.webhook_logs (webhook_id, event, payload, response_status, response_body, is_success, delivered_at, duration_ms, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: eboe
--

COPY public.webhooks (company_id, name, url, secret_hash, events, is_active, last_triggered_at, failure_count, id, created_at, updated_at, deleted_at, created_by, updated_by, is_deleted) FROM stdin;
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eboe
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: adjustments pk_adjustments; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.adjustments
    ADD CONSTRAINT pk_adjustments PRIMARY KEY (id);


--
-- Name: announcements pk_announcements; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT pk_announcements PRIMARY KEY (id);


--
-- Name: api_keys pk_api_keys; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT pk_api_keys PRIMARY KEY (id);


--
-- Name: audit_logs pk_audit_logs; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT pk_audit_logs PRIMARY KEY (id);


--
-- Name: bill_approvals pk_bill_approvals; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_approvals
    ADD CONSTRAINT pk_bill_approvals PRIMARY KEY (id);


--
-- Name: bill_attachments pk_bill_attachments; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_attachments
    ADD CONSTRAINT pk_bill_attachments PRIMARY KEY (id);


--
-- Name: bill_comments pk_bill_comments; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_comments
    ADD CONSTRAINT pk_bill_comments PRIMARY KEY (id);


--
-- Name: bill_items pk_bill_items; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT pk_bill_items PRIMARY KEY (id);


--
-- Name: bill_reminders pk_bill_reminders; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_reminders
    ADD CONSTRAINT pk_bill_reminders PRIMARY KEY (id);


--
-- Name: bill_status_history pk_bill_status_history; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_status_history
    ADD CONSTRAINT pk_bill_status_history PRIMARY KEY (id);


--
-- Name: bill_terms pk_bill_terms; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_terms
    ADD CONSTRAINT pk_bill_terms PRIMARY KEY (id);


--
-- Name: bill_versions pk_bill_versions; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_versions
    ADD CONSTRAINT pk_bill_versions PRIMARY KEY (id);


--
-- Name: bills pk_bills; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT pk_bills PRIMARY KEY (id);


--
-- Name: bookmarks pk_bookmarks; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT pk_bookmarks PRIMARY KEY (id);


--
-- Name: branches pk_branches; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT pk_branches PRIMARY KEY (id);


--
-- Name: companies pk_companies; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT pk_companies PRIMARY KEY (id);


--
-- Name: creditor_addresses pk_creditor_addresses; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_addresses
    ADD CONSTRAINT pk_creditor_addresses PRIMARY KEY (id);


--
-- Name: creditor_bank_details pk_creditor_bank_details; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_bank_details
    ADD CONSTRAINT pk_creditor_bank_details PRIMARY KEY (id);


--
-- Name: creditor_blacklist pk_creditor_blacklist; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_blacklist
    ADD CONSTRAINT pk_creditor_blacklist PRIMARY KEY (id);


--
-- Name: creditor_contacts pk_creditor_contacts; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_contacts
    ADD CONSTRAINT pk_creditor_contacts PRIMARY KEY (id);


--
-- Name: creditor_notes pk_creditor_notes; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_notes
    ADD CONSTRAINT pk_creditor_notes PRIMARY KEY (id);


--
-- Name: creditor_tags pk_creditor_tags; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_tags
    ADD CONSTRAINT pk_creditor_tags PRIMARY KEY (id);


--
-- Name: creditors pk_creditors; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditors
    ADD CONSTRAINT pk_creditors PRIMARY KEY (id);


--
-- Name: currencies pk_currencies; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT pk_currencies PRIMARY KEY (id);


--
-- Name: custom_field_values pk_custom_field_values; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT pk_custom_field_values PRIMARY KEY (id);


--
-- Name: custom_fields pk_custom_fields; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.custom_fields
    ADD CONSTRAINT pk_custom_fields PRIMARY KEY (id);


--
-- Name: customer_addresses pk_customer_addresses; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT pk_customer_addresses PRIMARY KEY (id);


--
-- Name: customer_bank_details pk_customer_bank_details; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_bank_details
    ADD CONSTRAINT pk_customer_bank_details PRIMARY KEY (id);


--
-- Name: customer_blacklist pk_customer_blacklist; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_blacklist
    ADD CONSTRAINT pk_customer_blacklist PRIMARY KEY (id);


--
-- Name: customer_contacts pk_customer_contacts; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT pk_customer_contacts PRIMARY KEY (id);


--
-- Name: customer_notes pk_customer_notes; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_notes
    ADD CONSTRAINT pk_customer_notes PRIMARY KEY (id);


--
-- Name: customer_tags pk_customer_tags; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_tags
    ADD CONSTRAINT pk_customer_tags PRIMARY KEY (id);


--
-- Name: customers pk_customers; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT pk_customers PRIMARY KEY (id);


--
-- Name: documents pk_documents; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT pk_documents PRIMARY KEY (id);


--
-- Name: email_templates pk_email_templates; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT pk_email_templates PRIMARY KEY (id);


--
-- Name: holidays pk_holidays; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT pk_holidays PRIMARY KEY (id);


--
-- Name: notifications pk_notifications; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT pk_notifications PRIMARY KEY (id);


--
-- Name: payment_proofs pk_payment_proofs; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT pk_payment_proofs PRIMARY KEY (id);


--
-- Name: payments pk_payments; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT pk_payments PRIMARY KEY (id);


--
-- Name: permissions pk_permissions; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT pk_permissions PRIMARY KEY (id);


--
-- Name: recycle_bin pk_recycle_bin; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.recycle_bin
    ADD CONSTRAINT pk_recycle_bin PRIMARY KEY (id);


--
-- Name: refunds pk_refunds; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT pk_refunds PRIMARY KEY (id);


--
-- Name: role_permissions pk_role_permissions; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id);


--
-- Name: roles pk_roles; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT pk_roles PRIMARY KEY (id);


--
-- Name: scheduled_reports pk_scheduled_reports; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT pk_scheduled_reports PRIMARY KEY (id);


--
-- Name: settings pk_settings; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT pk_settings PRIMARY KEY (id);


--
-- Name: tax_configs pk_tax_configs; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.tax_configs
    ADD CONSTRAINT pk_tax_configs PRIMARY KEY (id);


--
-- Name: user_sessions pk_user_sessions; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT pk_user_sessions PRIMARY KEY (id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: webhook_logs pk_webhook_logs; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT pk_webhook_logs PRIMARY KEY (id);


--
-- Name: webhooks pk_webhooks; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT pk_webhooks PRIMARY KEY (id);


--
-- Name: settings uix_company_category_key; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT uix_company_category_key UNIQUE (company_id, category, key);


--
-- Name: email_templates uix_company_template_name; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT uix_company_template_name UNIQUE (company_id, name);


--
-- Name: bookmarks uix_user_resource; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT uix_user_resource UNIQUE (user_id, resource_type, resource_id);


--
-- Name: bills uq_bills_bill_number; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT uq_bills_bill_number UNIQUE (bill_number);


--
-- Name: creditor_blacklist uq_creditor_blacklist_creditor_id; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_blacklist
    ADD CONSTRAINT uq_creditor_blacklist_creditor_id UNIQUE (creditor_id);


--
-- Name: currencies uq_currencies_code; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT uq_currencies_code UNIQUE (code);


--
-- Name: customer_blacklist uq_customer_blacklist_customer_id; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_blacklist
    ADD CONSTRAINT uq_customer_blacklist_customer_id UNIQUE (customer_id);


--
-- Name: payments uq_payments_receipt_number; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT uq_payments_receipt_number UNIQUE (receipt_number);


--
-- Name: payments uq_payments_transaction_number; Type: CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT uq_payments_transaction_number UNIQUE (transaction_number);


--
-- Name: ix_audit_logs_action; Type: INDEX; Schema: public; Owner: eboe
--

CREATE INDEX ix_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: ix_audit_logs_resource_id; Type: INDEX; Schema: public; Owner: eboe
--

CREATE INDEX ix_audit_logs_resource_id ON public.audit_logs USING btree (resource_id);


--
-- Name: ix_audit_logs_resource_type; Type: INDEX; Schema: public; Owner: eboe
--

CREATE INDEX ix_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- Name: ix_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: eboe
--

CREATE INDEX ix_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: ix_creditor_tags_tag; Type: INDEX; Schema: public; Owner: eboe
--

CREATE INDEX ix_creditor_tags_tag ON public.creditor_tags USING btree (tag);


--
-- Name: ix_customer_tags_tag; Type: INDEX; Schema: public; Owner: eboe
--

CREATE INDEX ix_customer_tags_tag ON public.customer_tags USING btree (tag);


--
-- Name: ix_permissions_name; Type: INDEX; Schema: public; Owner: eboe
--

CREATE UNIQUE INDEX ix_permissions_name ON public.permissions USING btree (name);


--
-- Name: ix_roles_name; Type: INDEX; Schema: public; Owner: eboe
--

CREATE UNIQUE INDEX ix_roles_name ON public.roles USING btree (name);


--
-- Name: ix_settings_category; Type: INDEX; Schema: public; Owner: eboe
--

CREATE INDEX ix_settings_category ON public.settings USING btree (category);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: eboe
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: adjustments fk_adjustments_adjusted_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.adjustments
    ADD CONSTRAINT fk_adjustments_adjusted_by_users FOREIGN KEY (adjusted_by) REFERENCES public.users(id);


--
-- Name: adjustments fk_adjustments_approved_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.adjustments
    ADD CONSTRAINT fk_adjustments_approved_by_users FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: adjustments fk_adjustments_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.adjustments
    ADD CONSTRAINT fk_adjustments_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: announcements fk_announcements_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT fk_announcements_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: api_keys fk_api_keys_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT fk_api_keys_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: audit_logs fk_audit_logs_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_audit_logs_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: audit_logs fk_audit_logs_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_audit_logs_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bill_approvals fk_bill_approvals_approver_id_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_approvals
    ADD CONSTRAINT fk_bill_approvals_approver_id_users FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: bill_approvals fk_bill_approvals_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_approvals
    ADD CONSTRAINT fk_bill_approvals_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_attachments fk_bill_attachments_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_attachments
    ADD CONSTRAINT fk_bill_attachments_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_attachments fk_bill_attachments_document_id_documents; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_attachments
    ADD CONSTRAINT fk_bill_attachments_document_id_documents FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: bill_comments fk_bill_comments_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_comments
    ADD CONSTRAINT fk_bill_comments_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_comments fk_bill_comments_parent_comment_id_bill_comments; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_comments
    ADD CONSTRAINT fk_bill_comments_parent_comment_id_bill_comments FOREIGN KEY (parent_comment_id) REFERENCES public.bill_comments(id);


--
-- Name: bill_comments fk_bill_comments_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_comments
    ADD CONSTRAINT fk_bill_comments_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bill_items fk_bill_items_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_items
    ADD CONSTRAINT fk_bill_items_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_reminders fk_bill_reminders_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_reminders
    ADD CONSTRAINT fk_bill_reminders_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_status_history fk_bill_status_history_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_status_history
    ADD CONSTRAINT fk_bill_status_history_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_status_history fk_bill_status_history_changed_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_status_history
    ADD CONSTRAINT fk_bill_status_history_changed_by_users FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: bill_terms fk_bill_terms_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_terms
    ADD CONSTRAINT fk_bill_terms_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_versions fk_bill_versions_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_versions
    ADD CONSTRAINT fk_bill_versions_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: bill_versions fk_bill_versions_created_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bill_versions
    ADD CONSTRAINT fk_bill_versions_created_by_users FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: bills fk_bills_branch_id_branches; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_branch_id_branches FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: bills fk_bills_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bills fk_bills_creditor_id_creditors; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_creditor_id_creditors FOREIGN KEY (creditor_id) REFERENCES public.creditors(id);


--
-- Name: bills fk_bills_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_customer_id_customers FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: bills fk_bills_drawee_creditor_id_creditors; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_drawee_creditor_id_creditors FOREIGN KEY (drawee_creditor_id) REFERENCES public.creditors(id);


--
-- Name: bills fk_bills_network_drawee_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_network_drawee_company_id_companies FOREIGN KEY (network_drawee_company_id) REFERENCES public.companies(id);


--
-- Name: bills fk_bills_network_payee_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_network_payee_company_id_companies FOREIGN KEY (network_payee_company_id) REFERENCES public.companies(id);


--
-- Name: bills fk_bills_parent_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_parent_bill_id_bills FOREIGN KEY (parent_bill_id) REFERENCES public.bills(id);


--
-- Name: bills fk_bills_payee_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT fk_bills_payee_customer_id_customers FOREIGN KEY (payee_customer_id) REFERENCES public.customers(id);


--
-- Name: bookmarks fk_bookmarks_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT fk_bookmarks_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: branches fk_branches_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT fk_branches_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: creditor_addresses fk_creditor_addresses_creditor_id_creditors; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_addresses
    ADD CONSTRAINT fk_creditor_addresses_creditor_id_creditors FOREIGN KEY (creditor_id) REFERENCES public.creditors(id);


--
-- Name: creditor_bank_details fk_creditor_bank_details_creditor_id_creditors; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_bank_details
    ADD CONSTRAINT fk_creditor_bank_details_creditor_id_creditors FOREIGN KEY (creditor_id) REFERENCES public.creditors(id);


--
-- Name: creditor_blacklist fk_creditor_blacklist_blacklisted_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_blacklist
    ADD CONSTRAINT fk_creditor_blacklist_blacklisted_by_users FOREIGN KEY (blacklisted_by) REFERENCES public.users(id);


--
-- Name: creditor_blacklist fk_creditor_blacklist_creditor_id_creditors; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_blacklist
    ADD CONSTRAINT fk_creditor_blacklist_creditor_id_creditors FOREIGN KEY (creditor_id) REFERENCES public.creditors(id);


--
-- Name: creditor_contacts fk_creditor_contacts_creditor_id_creditors; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_contacts
    ADD CONSTRAINT fk_creditor_contacts_creditor_id_creditors FOREIGN KEY (creditor_id) REFERENCES public.creditors(id);


--
-- Name: creditor_notes fk_creditor_notes_creditor_id_creditors; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_notes
    ADD CONSTRAINT fk_creditor_notes_creditor_id_creditors FOREIGN KEY (creditor_id) REFERENCES public.creditors(id);


--
-- Name: creditor_notes fk_creditor_notes_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_notes
    ADD CONSTRAINT fk_creditor_notes_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: creditor_tags fk_creditor_tags_creditor_id_creditors; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditor_tags
    ADD CONSTRAINT fk_creditor_tags_creditor_id_creditors FOREIGN KEY (creditor_id) REFERENCES public.creditors(id);


--
-- Name: creditors fk_creditors_branch_id_branches; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditors
    ADD CONSTRAINT fk_creditors_branch_id_branches FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: creditors fk_creditors_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.creditors
    ADD CONSTRAINT fk_creditors_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: custom_field_values fk_custom_field_values_custom_field_id_custom_fields; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.custom_field_values
    ADD CONSTRAINT fk_custom_field_values_custom_field_id_custom_fields FOREIGN KEY (custom_field_id) REFERENCES public.custom_fields(id);


--
-- Name: custom_fields fk_custom_fields_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.custom_fields
    ADD CONSTRAINT fk_custom_fields_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: customer_addresses fk_customer_addresses_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT fk_customer_addresses_customer_id_customers FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_bank_details fk_customer_bank_details_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_bank_details
    ADD CONSTRAINT fk_customer_bank_details_customer_id_customers FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_blacklist fk_customer_blacklist_blacklisted_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_blacklist
    ADD CONSTRAINT fk_customer_blacklist_blacklisted_by_users FOREIGN KEY (blacklisted_by) REFERENCES public.users(id);


--
-- Name: customer_blacklist fk_customer_blacklist_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_blacklist
    ADD CONSTRAINT fk_customer_blacklist_customer_id_customers FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_contacts fk_customer_contacts_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_contacts
    ADD CONSTRAINT fk_customer_contacts_customer_id_customers FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_notes fk_customer_notes_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_notes
    ADD CONSTRAINT fk_customer_notes_customer_id_customers FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_notes fk_customer_notes_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_notes
    ADD CONSTRAINT fk_customer_notes_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: customer_tags fk_customer_tags_customer_id_customers; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customer_tags
    ADD CONSTRAINT fk_customer_tags_customer_id_customers FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customers fk_customers_branch_id_branches; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_branch_id_branches FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: customers fk_customers_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customers_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: documents fk_documents_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: documents fk_documents_uploaded_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_documents_uploaded_by_users FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: email_templates fk_email_templates_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT fk_email_templates_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: holidays fk_holidays_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT fk_holidays_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: notifications fk_notifications_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: notifications fk_notifications_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payment_proofs fk_payment_proofs_document_id_documents; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT fk_payment_proofs_document_id_documents FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: payment_proofs fk_payment_proofs_payment_id_payments; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT fk_payment_proofs_payment_id_payments FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: payments fk_payments_bill_id_bills; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_bill_id_bills FOREIGN KEY (bill_id) REFERENCES public.bills(id);


--
-- Name: payments fk_payments_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: payments fk_payments_received_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_received_by_users FOREIGN KEY (received_by) REFERENCES public.users(id);


--
-- Name: recycle_bin fk_recycle_bin_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.recycle_bin
    ADD CONSTRAINT fk_recycle_bin_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: refunds fk_refunds_approved_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_approved_by_users FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: refunds fk_refunds_payment_id_payments; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_payment_id_payments FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: refunds fk_refunds_refunded_by_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT fk_refunds_refunded_by_users FOREIGN KEY (refunded_by) REFERENCES public.users(id);


--
-- Name: role_permissions fk_role_permissions_permission_id_permissions; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_permission_id_permissions FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions fk_role_permissions_role_id_roles; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_role_id_roles FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: scheduled_reports fk_scheduled_reports_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT fk_scheduled_reports_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: settings fk_settings_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT fk_settings_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: tax_configs fk_tax_configs_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.tax_configs
    ADD CONSTRAINT fk_tax_configs_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: user_sessions fk_user_sessions_user_id_users; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT fk_user_sessions_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users fk_users_branch_id_branches; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_branch_id_branches FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: users fk_users_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: users fk_users_role_id_roles; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role_id_roles FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: webhook_logs fk_webhook_logs_webhook_id_webhooks; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT fk_webhook_logs_webhook_id_webhooks FOREIGN KEY (webhook_id) REFERENCES public.webhooks(id);


--
-- Name: webhooks fk_webhooks_company_id_companies; Type: FK CONSTRAINT; Schema: public; Owner: eboe
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT fk_webhooks_company_id_companies FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- PostgreSQL database dump complete
--

\unrestrict VRPtnMmrEjf0CO67Tc8Re0s7FOUQo9MH22tMAyQnQ8gaDzkJe0dzt1oEUaMnepr

