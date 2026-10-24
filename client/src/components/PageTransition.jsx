import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className="cc-page-enter">
      {children}
    </div>
  );
}
