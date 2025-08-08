from base_producer import BaseProducer
import os

class LogonProducer(BaseProducer):
    def __init__(self):
        super().__init__(
            topic_name='logon',
            csv_file_path='/app/dataset/logon.csv',
            batch_size=int(os.getenv('BATCH_SIZE', 2)),
            message_sleep_range=(5, 20),
            start_at_line=int(os.getenv('START_AT_LINE', 0))
        )

if __name__ == "__main__":
    LogonProducer().run()
