import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  to { transform: rotate(360deg); }
`

const PlayIcon = () => (
  <svg className="icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 39c-.549 0-1.095-.15-1.578-.447A3.008 3.008 0 0 1 9 36V12c0-1.041.54-2.007 1.422-2.553a3.014 3.014 0 0 1 2.919-.132l24 12a3.003 3.003 0 0 1 0 5.37l-24 12c-.42.21-.885.315-1.341.315z"
    />
  </svg>
)

const SendIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="currentColor"
      d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
    />
  </svg>
)

/**
 * @param {{
 *   children: React.ReactNode
 *   onClick?: () => void
 *   disabled?: boolean
 *   loading?: boolean
 *   type?: 'button' | 'submit'
 *   icon?: 'play' | 'send'
 *   className?: string
 *   loadingLabel?: string
 * }} props
 */
export default function QuizButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  icon = 'play',
  className = '',
  loadingLabel,
}) {
  const isDisabled = disabled || loading
  const busyLabel = loadingLabel ?? String(children)

  return (
    <StyledWrapper className={className}>
      <button
        type={type}
        className={`button-with-icon${loading ? ' is-loading' : ''}`}
        onClick={onClick}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-label={loading ? busyLabel : undefined}
      >
        <span className="icon-slot" aria-hidden="true">
          <span className="icon-default">{icon === 'send' ? <SendIcon /> : <PlayIcon />}</span>
          <span className="icon-spinner" />
        </span>
        <span className="label" aria-hidden={loading || undefined}>
          {children}
        </span>
      </button>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  display: inline-flex;
  flex-shrink: 0;

  .button-with-icon {
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid #3c3489;
    font-family: 'DM Sans', system-ui, sans-serif;
    letter-spacing: 0.04em;
    padding: 0 14px;
    height: 40px;
    font-size: 14px;
    text-transform: uppercase;
    font-weight: 600;
    border-radius: 8px;
    outline: none;
    user-select: none;
    cursor: pointer;
    transform: translateY(0);
    position: relative;
    box-shadow:
      inset 0 30px 30px -15px rgba(255, 255, 255, 0.12),
      inset 0 0 0 1px rgba(255, 255, 255, 0.25),
      inset 0 1px 20px rgba(0, 0, 0, 0),
      0 3px 0 #3c3489,
      0 3px 2px rgba(0, 0, 0, 0.15),
      0 5px 10px rgba(83, 74, 183, 0.2);
    background: #534ab7;
    color: white;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
    transition: box-shadow 150ms ease-in-out, transform 150ms ease-in-out;
  }

  .button-with-icon:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .button-with-icon.is-loading {
    cursor: wait;
    justify-content: center;
  }

  .icon-slot {
    position: absolute;
    left: 14px;
    top: 50%;
    width: 22px;
    height: 22px;
    transform: translateY(-50%);
    transition:
      left 0.45s ease-in-out,
      transform 0.45s ease-in-out,
      opacity 0.35s ease-in-out;
    pointer-events: none;
  }

  .icon-default,
  .icon-spinner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.35s ease-in-out;
  }

  .icon-default .icon {
    width: 22px;
    height: 22px;
    display: block;
  }

  .icon-spinner {
    opacity: 0;
  }

  .icon-spinner::after {
    content: '';
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ${spin} 0.75s linear infinite;
  }

  .label {
    display: inline-block;
    margin-left: 30px;
    white-space: nowrap;
    transition:
      transform 0.45s ease-in-out,
      opacity 0.35s ease-in-out,
      visibility 0.35s ease-in-out;
  }

  /* Loading: text exits, spinner centered, width unchanged (label still in flow) */
  .button-with-icon.is-loading .label {
    transform: translateX(120%);
    opacity: 0;
    visibility: hidden;
  }

  .button-with-icon.is-loading .icon-default {
    opacity: 0;
  }

  .button-with-icon.is-loading .icon-spinner {
    opacity: 1;
  }

  .button-with-icon.is-loading .icon-slot {
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .button-with-icon:not(:disabled):not(.is-loading):active {
    transform: translateY(3px);
    box-shadow:
      inset 0 16px 2px -15px rgba(0, 0, 0, 0),
      inset 0 0 0 1px rgba(255, 255, 255, 0.15),
      inset 0 1px 20px rgba(0, 0, 0, 0.08),
      0 0 0 #3c3489,
      0 0 0 2px rgba(255, 255, 255, 0.35);
  }

  /* Hover: text slides out and hides; icon centers; width stays (label keeps layout space) */
  .button-with-icon:not(:disabled):not(.is-loading):hover .label {
    transform: translateX(120%);
    opacity: 0;
    visibility: hidden;
  }

  .button-with-icon:not(:disabled):not(.is-loading):hover .icon-slot {
    left: 50%;
    transform: translate(-50%, -50%);
  }
`
