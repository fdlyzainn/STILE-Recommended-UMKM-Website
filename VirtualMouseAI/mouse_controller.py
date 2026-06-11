import pyautogui
import math

pyautogui.FAILSAFE = False

class MouseController:

    @staticmethod
    def move(x, y):
        pyautogui.moveTo(x, y)

    @staticmethod
    def left_click():
        pyautogui.click()

    @staticmethod
    def right_click():
        pyautogui.rightClick()

    @staticmethod
    def double_click():
        pyautogui.doubleClick()

    @staticmethod
    def scroll_up():
        pyautogui.scroll(300)

    @staticmethod
    def scroll_down():
        pyautogui.scroll(-300)

    @staticmethod
    def distance(x1,y1,x2,y2):

        return math.hypot(
            x2 - x1,
            y2 - y1
        )