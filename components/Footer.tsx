const Footer = () => {
  return (
    <ul className="fixed bottom-16 md:bottom-0 left-0 md:left-24 w-full md:w-[calc(100vw-6rem)] h-11 flex justify-center items-center gap-12 border-t border-gray-700 dark:text-gray-400 text-sm bg-background z-40">
      <li className="cursor-pointer">Noir</li>
      <li className="cursor-pointer">About</li>
      <li className="cursor-pointer">Contact us</li>
      <li className="cursor-pointer">Terms & Conditions</li>
    </ul>
  );
};

export default Footer;