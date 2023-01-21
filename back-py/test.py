from fake_useragent import UserAgent

ua = UserAgent(use_external_data=True)
print(ua.firefox)
