import qrcode

def make_QR(json):
    """
    Receives a json object and creates a QR based on the stringified version of the custom_json
    The name of the file is the ticket_id property.
    """
    data_string = str(data)
    qr =  qrcode.make(data_string)
    type(qr)
    filename = str(data["ticket"]["ticket_id"])
    qr.save(filename)
