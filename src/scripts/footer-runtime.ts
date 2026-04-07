const socialMessages: Record<string, string> = {
  wechat: 'WeChat 官方账号即将上线，敬请期待！',
  linkedin: 'LinkedIn 官方账号即将上线，敬请期待！',
  twitter: 'X 官方账号即将上线，敬请期待！',
};

document
  .querySelectorAll<HTMLButtonElement>('.social-icon.placeholder[data-social]')
  .forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.social;
      if (!key) return;
      const message = socialMessages[key];
      if (message) {
        alert(message);
      }
    });
  });
