import ReactMarkdown from 'react-markdown';
import volunteerGuide from '../../../docs/guide-volunteers.md?raw';
import internGuide from '../../../docs/guide-interns-staff.md?raw';

interface Props {
  role: 'volunteer' | 'intern';
}

export default function HelpGuide({ role }: Props) {
  const content = role === 'volunteer' ? volunteerGuide : internGuide;

  return (
    <div className="help-guide">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
